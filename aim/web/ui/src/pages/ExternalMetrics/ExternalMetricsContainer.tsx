import React from 'react';

import ErrorBoundary from 'components/ErrorBoundary/ErrorBoundary';
import BusyLoaderWrapper from 'components/BusyLoaderWrapper/BusyLoaderWrapper';

import externalService from 'services/api/external/externalService';

import exceptionHandler from 'utils/app/exceptionHandler';

import ExternalMetrics from './ExternalMetrics';

function ExternalMetricsContainer(): React.FunctionComponentElement<React.ReactNode> {
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [data, setData] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const request = externalService.getExternalData();
    request
      .call((detail: any) => {
        exceptionHandler({ detail });
        setError(detail?.detail ?? 'Failed to load external data.');
        setIsLoading(false);
      })
      .then((response: any) => {
        if (!response) {
          setError('Received empty response from external data endpoint.');
        } else {
          setData(response);
        }
        setIsLoading(false);
      })
      .catch((err: Error) => {
        if (err.name !== 'AbortError') {
          setError(err.message);
          setIsLoading(false);
        }
      });

    return () => {
      request?.abort();
    };
  }, []);

  return (
    <ErrorBoundary>
      <BusyLoaderWrapper isLoading={isLoading} height='100%'>
        <ExternalMetrics data={data} error={error} />
      </BusyLoaderWrapper>
    </ErrorBoundary>
  );
}

export default ExternalMetricsContainer;
