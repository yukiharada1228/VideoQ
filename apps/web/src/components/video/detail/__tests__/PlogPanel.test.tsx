import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { PlogGraph } from '@videoq/trpc';
import { PlogPanel } from '../PlogPanel';

const emptyGraph: PlogGraph = {
  video_id: 42,
  build_status: 'ready',
  input_tokens: 0,
  output_tokens: 0,
  error_message: '',
  summary_node_count: 0,
  concepts: [],
  edges: [],
};

it('shows a completed empty graph as informational and allows manual additions', async () => {
  globalThis.__setTrpcHandler('plog.graph', () => emptyGraph);
  render(<PlogPanel videoId={42} />);

  expect(await screen.findByText('plog.statusLabel.empty')).toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('plog.noConceptsTitle');
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(screen.queryByText('plog.statusLabel.ready')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'plog.addConcept' })).toBeEnabled();
});

it('allows an explicit rebuild after an empty analysis', async () => {
  let rebuilding = false;
  const rebuild = vi.fn(() => {
    rebuilding = true;
    return { status: 'queued' };
  });
  globalThis.__setTrpcHandler('plog.graph', () => ({
    ...emptyGraph, build_status: rebuilding ? 'pending' : 'ready',
  }));
  globalThis.__setTrpcHandler('plog.rebuild', rebuild);
  render(<PlogPanel videoId={42} />);

  fireEvent.click(await screen.findByRole('button', { name: 'plog.rebuild' }));

  await waitFor(() => expect(rebuild).toHaveBeenCalledWith({ videoId: 42 }));
  expect(await screen.findByText('plog.buildingTitle')).toBeInTheDocument();
  expect(screen.queryByText('plog.noConceptsTitle')).not.toBeInTheDocument();
});

it.each(['pending', 'failed'])('does not label a %s build as empty', async (status) => {
  globalThis.__setTrpcHandler('plog.graph', () => ({
    ...emptyGraph, build_status: status, error_message: status === 'failed' ? 'API unavailable' : '',
  }));
  render(<PlogPanel videoId={42} />);

  expect(await screen.findByText(`plog.statusLabel.${status}`)).toBeInTheDocument();
  expect(screen.queryByText('plog.noConceptsTitle')).not.toBeInTheDocument();
  if (status === 'failed') {
    expect(screen.getByRole('alert')).toHaveTextContent('API unavailable');
  }
});
