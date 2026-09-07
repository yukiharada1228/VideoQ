from __future__ import annotations

import json
import os
from contextlib import contextmanager
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest
import psycopg
from psycopg import sql

from worker_python import lambda_handler
from worker_python.pipeline import plog_build
from worker_python.tasks import build_plog


@pytest.fixture
def extraction(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    client = MagicMock()
    monkeypatch.setattr("openai.OpenAI", MagicMock(return_value=client))

    def respond(content):
        client.chat.completions.create.return_value = SimpleNamespace(
            choices=[SimpleNamespace(message=SimpleNamespace(content=content))]
        )

    respond('{"concepts":[]}')
    return client, respond


def test_explicit_empty_inventory_is_valid(extraction) -> None:
    assert plog_build._extract_concepts("This is a recording test.", []) == []


@pytest.mark.parametrize(
    "content",
    [None, "not JSON", "[]", "null", "{}", '{"concepts":null}',
     '{"concepts":{}}', '{"concepts":[{}]}', '{"concepts":[null]}',
     '{"concepts":[{"label":42}]}', '{"concepts":[{"label":"  "}]}',
     '{"concepts":[{"label":"Evaporation"},{}]}'],
)
def test_invalid_extraction_is_not_treated_as_no_concepts(extraction, content) -> None:
    _, respond = extraction
    respond(content)
    with pytest.raises(ValueError):
        plog_build._extract_concepts("transcript", [])


def test_valid_inventory_preserves_concept_details(extraction) -> None:
    _, respond = extraction
    respond(json.dumps({"concepts": [{"label": " Evaporation ", "intro_sec": 3}]}))
    assert plog_build._extract_concepts("transcript", []) == [
        {"label": "Evaporation", "intro_sec": 3}
    ]


@pytest.mark.skipif(
    not os.environ.get("DATABASE_URL"),
    reason="DATABASE_URL is required for PostgreSQL integration tests",
)
def test_empty_rebuild_clears_only_target_video_artifacts_without_embeddings(
    extraction, monkeypatch,
) -> None:
    embed = MagicMock()
    monkeypatch.setattr(plog_build, "embed_texts", embed)

    with psycopg.connect(os.environ["DATABASE_URL"]) as conn:
        # All test data stays in session-local tables, including the FK children.
        conn.execute("CREATE TEMP TABLE plog_concepts (id int PRIMARY KEY, video_id int)")
        for table in ("learner_concept_states", "plog_learning_objects"):
            conn.execute(sql.SQL(
                "CREATE TEMP TABLE {} (concept_id int REFERENCES plog_concepts(id))"
            ).format(sql.Identifier(table)))
        conn.execute("""
            CREATE TEMP TABLE plog_edges (
                video_id int, source_id int REFERENCES plog_concepts(id),
                target_id int REFERENCES plog_concepts(id)
            )
        """)
        conn.execute("CREATE TEMP TABLE plog_summary_nodes (video_id int)")
        for video_id in (42, 43):
            conn.execute("INSERT INTO plog_concepts VALUES (%s, %s)", (video_id, video_id))
            for table in ("learner_concept_states", "plog_learning_objects"):
                conn.execute(sql.SQL("INSERT INTO {} VALUES (%s)").format(
                    sql.Identifier(table)
                ), (video_id,))
            conn.execute("INSERT INTO plog_edges VALUES (%s, %s, %s)", (video_id,) * 3)
            conn.execute("INSERT INTO plog_summary_nodes VALUES (%s)", (video_id,))

        plog_build.run_plog_pipeline(conn, 42, "This is a recording test.")

        assert conn.execute("SELECT id FROM plog_concepts").fetchall() == [(43,)]
        for table in ("learner_concept_states", "plog_learning_objects"):
            assert conn.execute(sql.SQL("SELECT concept_id FROM {}").format(
                sql.Identifier(table)
            )).fetchall() == [(43,)]
        for table in ("plog_edges", "plog_summary_nodes"):
            assert conn.execute(sql.SQL("SELECT video_id FROM {}").format(
                sql.Identifier(table)
            )).fetchall() == [(43,)]

    embed.assert_not_called()


def test_invalid_extraction_does_not_clear_existing_graph(extraction) -> None:
    _, respond = extraction
    respond('{"concepts":null}')
    conn = MagicMock()

    with pytest.raises(ValueError):
        plog_build.run_plog_pipeline(conn, 42, "transcript")

    conn.execute.assert_not_called()


@pytest.mark.parametrize("api_failure", [False, True])
def test_sqs_completes_empty_analysis_but_retries_api_failure(
    extraction, monkeypatch, api_failure,
) -> None:
    client, _ = extraction
    if api_failure:
        client.chat.completions.create.side_effect = RuntimeError("API unavailable")
    conn = MagicMock()

    @contextmanager
    def connection():
        yield conn

    monkeypatch.setattr(build_plog, "db_connection", connection)
    monkeypatch.setattr(
        build_plog, "get_video_for_task",
        MagicMock(return_value=SimpleNamespace(transcript="This is a recording test.")),
    )
    monkeypatch.setattr(build_plog, "_claim_build_job", MagicMock(return_value=7))
    update = MagicMock()
    monkeypatch.setattr(build_plog, "_update_build_job", update)
    monkeypatch.setattr(lambda_handler, "ensure_secrets_loaded", MagicMock())
    monkeypatch.setattr(
        lambda_handler, "claim_job_execution", MagicMock(return_value="lease-1"),
    )
    monkeypatch.setattr(
        lambda_handler, "get_task", MagicMock(return_value=build_plog.build_plog_artifacts),
    )
    complete, fail = MagicMock(), MagicMock()
    monkeypatch.setattr(lambda_handler, "complete_job_execution", complete)
    monkeypatch.setattr(lambda_handler, "fail_job_execution", fail)
    event = {"Records": [{"messageId": "message-1", "body": json.dumps({
        "type": "build_plog", "job_id": "job-1", "payload": {"video_id": 42},
    })}]}

    result = lambda_handler.handler(event, None)

    if api_failure:
        assert result == {"batchItemFailures": [{"itemIdentifier": "message-1"}]}
        assert update.call_args.kwargs["status"] == "failed"
        complete.assert_not_called()
        fail.assert_called_once_with("job-1", "lease-1", "API unavailable")
    else:
        assert result == {"batchItemFailures": []}
        update.assert_called_once_with(conn, 7, status="ready", finished=True)
        complete.assert_called_once_with("job-1", "lease-1")
        fail.assert_not_called()
    assert conn.commit.call_count == 2
