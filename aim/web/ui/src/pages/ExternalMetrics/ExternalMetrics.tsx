import React from 'react';

import { formatValue } from 'utils/formatValue';

import './ExternalMetrics.scss';

type ExternalMetricsProps = {
  data: any;
  error: string | null;
};

function ExternalMetrics({ data, error }: ExternalMetricsProps) {
  const renderValue = React.useCallback((value: unknown) => {
    const formatted = formatValue(value ?? null);
    if (typeof formatted === 'string') {
      return formatted.replace(/^"|"$/g, '');
    }
    return formatted;
  }, []);

  const validationMetrics = React.useMemo(() => {
    if (!data?.metrics?.length) {
      return [];
    }
    return data.metrics.filter(
      (item: Record<string, any>) => item?.event === 'val_epoch_end',
    );
  }, [data?.metrics]);

  const trainingMetrics = React.useMemo(() => {
    if (!data?.metrics?.length) {
      return [];
    }
    return data.metrics.filter(
      (item: Record<string, any>) => item?.event === 'train_step',
    );
  }, [data?.metrics]);

  const predictionPreview = React.useMemo(() => {
    if (!data?.predictions?.rows?.length) {
      return [];
    }
    return data.predictions.rows.slice(0, 20);
  }, [data?.predictions?.rows]);

  const configuredPath =
    data?.configured_path && data?.configured_path !== data?.base_path
      ? data?.configured_path
      : null;

  return (
    <div className='ExternalMetrics'>
      <div className='ExternalMetrics__header'>
        <div>
          <h2>External Metric Preview</h2>
          <p className='ExternalMetrics__muted'>
            Reading from <code>{data?.base_path ?? 'n/a'}</code>
            {configuredPath && (
              <>
                {' '}
                (configured as <code>{configuredPath}</code>)
              </>
            )}
          </p>
        </div>
      </div>

      {error && (
        <div className='ExternalMetrics__error'>
          <strong>Unable to load external metrics:</strong> {error}
        </div>
      )}

      <section className='ExternalMetrics__section'>
        <header>
          <h3>Validation Metrics</h3>
          <p className='ExternalMetrics__muted'>
            Showing {validationMetrics?.length ?? 0} epochs from
            <code>metrics.jsonl</code>
          </p>
        </header>
        {validationMetrics.length ? (
          <div className='ExternalMetrics__tableWrapper'>
            <table>
              <thead>
                <tr>
                  <th>Epoch</th>
                  <th>AUROC</th>
                  <th>AUPRC</th>
                  <th>Brier</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {validationMetrics.map((metric: Record<string, any>) => (
                  <tr key={`val-${metric?.epoch}`}>
                    <td>{metric?.epoch}</td>
                    <td>{renderValue(metric?.auroc)}</td>
                    <td>{renderValue(metric?.auprc)}</td>
                    <td>{renderValue(metric?.brier)}</td>
                    <td>{metric?.time ? renderValue(metric.time) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className='ExternalMetrics__empty'>No validation metrics found.</div>
        )}
      </section>

      <section className='ExternalMetrics__section'>
        <header>
          <h3>Training Loss</h3>
          <p className='ExternalMetrics__muted'>
            Showing {trainingMetrics?.length ?? 0} steps from
            <code>metrics.jsonl</code>
          </p>
        </header>
        {trainingMetrics.length ? (
          <div className='ExternalMetrics__tableWrapper'>
            <table>
              <thead>
                <tr>
                  <th>Step</th>
                  <th>Epoch</th>
                  <th>Train Loss</th>
                  <th>Learning Rate</th>
                </tr>
              </thead>
              <tbody>
                {trainingMetrics.map((metric: Record<string, any>) => (
                  <tr key={`train-${metric?.step}`}>
                    <td>{metric?.step}</td>
                    <td>{metric?.epoch}</td>
                    <td>{renderValue(metric?.train_loss)}</td>
                    <td>{renderValue(metric?.lr)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className='ExternalMetrics__empty'>No training metrics found.</div>
        )}
      </section>

      <section className='ExternalMetrics__section'>
        <header>
          <h3>Prediction Samples</h3>
          <p className='ExternalMetrics__muted'>
            Previewing {predictionPreview.length} of{' '}
            {data?.predictions?.rows?.length ?? 0} rows from
            <code>preds_val.csv</code>
          </p>
        </header>
        {predictionPreview.length ? (
          <div className='ExternalMetrics__tableWrapper ExternalMetrics__tableWrapper--scroll'>
            <table>
              <thead>
                <tr>
                  {(data?.predictions?.columns || []).map((column: string) => (
                    <th key={column}>{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {predictionPreview.map((row: Record<string, any>, index: number) => (
                  <tr key={`pred-${index}`}>
                    {(data?.predictions?.columns || []).map((column: string) => (
                      <td key={`${index}-${column}`}>{row[column] ?? '—'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className='ExternalMetrics__empty'>No predictions found.</div>
        )}
      </section>

      <section className='ExternalMetrics__section'>
        <header>
          <h3>Probe Summary</h3>
          <p className='ExternalMetrics__muted'>
            Rendering contents of <code>probe_ethnicity.json</code>
          </p>
        </header>
        {data?.probe && Object.keys(data.probe).length ? (
          <pre className='ExternalMetrics__json'>
            {JSON.stringify(data.probe, null, 2)}
          </pre>
        ) : (
          <div className='ExternalMetrics__empty'>No probe data found.</div>
        )}
      </section>
    </div>
  );
}

export default React.memo(ExternalMetrics);
