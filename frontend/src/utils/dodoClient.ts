import api from './api';

export const dodoClient = {
  createPayment: (data: { amount: number; currency: string; recipient: string }) =>
    api.post('/payments/dodo', data),
  getPayment: (id: string) => api.get(`/payments/dodo/${id}`),
};
