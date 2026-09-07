mock_provider "aws" {
  mock_data "aws_iam_policy_document" {
    defaults = {
      json = "{\"Version\":\"2012-10-17\",\"Statement\":[]}"
    }
  }
}
mock_provider "openai" {}

override_resource {
  target = aws_cloudwatch_log_group.worker
  values = {
    arn = "arn:aws:logs:ap-northeast-1:123456789012:log-group:/aws/lambda/test"
  }
}

override_resource {
  target          = aws_sqs_queue.dlq
  override_during = plan
  values = {
    arn = "arn:aws:sqs:ap-northeast-1:123456789012:test-dlq"
  }
}

variables {
  manage_openai_project = false
}

run "default_retry_budget" {
  command = plan

  assert {
    condition     = aws_sqs_queue.main.visibility_timeout_seconds >= 6 * aws_lambda_function.worker.timeout
    error_message = "The queue must allow Lambda processing and throttling retries."
  }

  assert {
    condition     = jsondecode(aws_sqs_queue.main.redrive_policy).maxReceiveCount >= 5
    error_message = "Transient failures need at least five attempts before dead-lettering."
  }
}

run "reject_short_visibility" {
  command = plan
  variables {
    sqs_visibility_timeout_seconds = 960
  }
  expect_failures = [var.sqs_visibility_timeout_seconds]
}

run "reject_insufficient_retries" {
  command = plan
  variables {
    sqs_max_receive_count = 3
  }
  expect_failures = [var.sqs_max_receive_count]
}
