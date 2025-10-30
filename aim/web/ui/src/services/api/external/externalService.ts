import API from '../api';

const endpoints = {
  GET_EXTERNAL_DATA: 'external/data',
};

function getExternalData(maxPredictionRows?: number) {
  return API.get(
    endpoints.GET_EXTERNAL_DATA,
    maxPredictionRows
      ? {
          max_prediction_rows: maxPredictionRows,
        }
      : undefined,
  );
}

const externalService = {
  endpoints,
  getExternalData,
};

export default externalService;
