import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { renderWithProviders } from '@/PRD/test-infrastructure/test-utils/render-with-providers';
import AccountsReceivable from '../../../pages/AccountsReceivable';
import { financeApiHandlers } from '../mocks/finance-api';
import { testDataBuilders } from '../setup';

const server = setupServer(...financeApiHandlers);

describe('Accounts Receivable Workflow Integration', () => {
  beforeEach(() => {
    server.listen();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-08-20'));
  });

  afterEach(() => {
    server.resetHandlers();
    vi.useRealTimers();
  });

  describe('Invoice Management', () => {
    it('should display invoices dashboard', async () => {
      renderWithProviders(<AccountsReceivable />);

      await waitFor(() => {
        expect(screen.getByText('應收帳款管理')).toBeInTheDocument();
        expect(screen.getByText('INV-2025-08-001')).toBeInTheDocument();
        expect(screen.getByText('INV-2025-08-002')).toBeInTheDocument();
      });

      // Check status indicators
      expect(screen.getByText('待付款')).toBeInTheDocument();
      expect(screen.getByText('已付款')).toBeInTheDocument();
      expect(screen.getByText('逾期')).toBeInTheDocument();
    });

    it('should create new invoice', async () => {
      renderWithProviders(<AccountsReceivable />);

      const createBtn = screen.getByRole('button', { name: /新增發票/ });
      fireEvent.click(createBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Select customer
      const customerSelect = screen.getByLabelText(/客戶/);
      fireEvent.change(customerSelect, { target: { value: 'CUST_001' } });

      // Add invoice items
      const addItemBtn = screen.getByRole('button', { name: /新增項目/ });
      fireEvent.click(addItemBtn);

      const productSelect = screen.getByLabelText(/產品/);
      fireEvent.change(productSelect, { target: { value: 'PROD_001' } });

      const quantityInput = screen.getByLabelText(/數量/);
      fireEvent.change(quantityInput, { target: { value: '100' } });

      const priceInput = screen.getByLabelText(/單價/);
      fireEvent.change(priceInput, { target: { value: '500' } });

      // Set payment terms
      const termsSelect = screen.getByLabelText(/付款條件/);
      fireEvent.change(termsSelect, { target: { value: 'net_30' } });

      // Save invoice
      const saveBtn = screen.getByRole('button', { name: /儲存發票/ });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(screen.getByText(/發票已建立/)).toBeInTheDocument();
      });
    });

    it('should record payment for invoice', async () => {
      renderWithProviders(<AccountsReceivable />);

      await waitFor(() => {
        expect(screen.getByText('INV-2025-08-001')).toBeInTheDocument();
      });

      const paymentBtn = screen.getByTestId('payment-INV_TEST_001');
      fireEvent.click(paymentBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/記錄付款/)).toBeInTheDocument();
      });

      // Enter payment details
      const amountInput = screen.getByLabelText(/付款金額/);
      fireEvent.change(amountInput, { target: { value: '50000' } });

      const dateInput = screen.getByLabelText(/付款日期/);
      fireEvent.change(dateInput, { target: { value: '2025-08-20' } });

      const methodSelect = screen.getByLabelText(/付款方式/);
      fireEvent.change(methodSelect, { target: { value: 'bank_transfer' } });

      const referenceInput = screen.getByLabelText(/參考編號/);
      fireEvent.change(referenceInput, { target: { value: 'REF-001' } });

      // Submit payment
      const submitBtn = screen.getByRole('button', { name: /確認付款/ });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/付款已記錄/)).toBeInTheDocument();
      });
    });

    it('should send invoice to customer', async () => {
      renderWithProviders(<AccountsReceivable />);

      await waitFor(() => {
        expect(screen.getByText('INV-2025-08-001')).toBeInTheDocument();
      });

      const sendBtn = screen.getByTestId('send-INV_TEST_001');
      fireEvent.click(sendBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const emailInput = screen.getByLabelText(/收件人/);
      expect(emailInput).toHaveValue('billing@test.com');

      const messageInput = screen.getByLabelText(/訊息/);
      fireEvent.change(messageInput, { target: { value: '請查收發票' } });

      const sendConfirmBtn = screen.getByRole('button', { name: /確認發送/ });
      fireEvent.click(sendConfirmBtn);

      await waitFor(() => {
        expect(screen.getByText(/發票已發送/)).toBeInTheDocument();
      });
    });

    it('should handle credit memo creation', async () => {
      renderWithProviders(<AccountsReceivable />);

      await waitFor(() => {
        expect(screen.getByText('INV-2025-08-001')).toBeInTheDocument();
      });

      const moreBtn = screen.getByTestId('more-INV_TEST_001');
      fireEvent.click(moreBtn);

      const creditMemoOption = screen.getByText('建立信用憑證');
      fireEvent.click(creditMemoOption);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Select items to credit
      const itemCheckbox = screen.getByLabelText(/產品A/);
      fireEvent.click(itemCheckbox);

      const quantityInput = screen.getByLabelText(/退貨數量/);
      fireEvent.change(quantityInput, { target: { value: '10' } });

      const reasonSelect = screen.getByLabelText(/原因/);
      fireEvent.change(reasonSelect, { target: { value: 'product_return' } });

      const submitBtn = screen.getByRole('button', { name: /建立信用憑證/ });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/信用憑證已建立/)).toBeInTheDocument();
      });
    });
  });

  describe('Customer Account Management', () => {
    it('should display customer account details', async () => {
      renderWithProviders(<AccountsReceivable />);

      const customerTab = screen.getByRole('tab', { name: /客戶帳戶/ });
      fireEvent.click(customerTab);

      await waitFor(() => {
        expect(screen.getByText('測試客戶A')).toBeInTheDocument();
        expect(screen.getByText('信用額度: NT$ 500,000')).toBeInTheDocument();
        expect(screen.getByText('已用額度: NT$ 150,000')).toBeInTheDocument();
      });
    });

    it('should generate customer statement', async () => {
      renderWithProviders(<AccountsReceivable />);

      const customerTab = screen.getByRole('tab', { name: /客戶帳戶/ });
      fireEvent.click(customerTab);

      await waitFor(() => {
        expect(screen.getByText('測試客戶A')).toBeInTheDocument();
      });

      const statementBtn = screen.getByRole('button', { name: /產生對帳單/ });
      fireEvent.click(statementBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const periodSelect = screen.getByLabelText(/期間/);
      fireEvent.change(periodSelect, { target: { value: '2025-08' } });

      const generateBtn = screen.getByRole('button', { name: /產生/ });
      fireEvent.click(generateBtn);

      await waitFor(() => {
        expect(screen.getByText(/對帳單已產生/)).toBeInTheDocument();
        expect(screen.getByText('STMT-2025-08-001')).toBeInTheDocument();
      });
    });

    it('should update credit limit', async () => {
      renderWithProviders(<AccountsReceivable />);

      const customerTab = screen.getByRole('tab', { name: /客戶帳戶/ });
      fireEvent.click(customerTab);

      await waitFor(() => {
        expect(screen.getByText('測試客戶A')).toBeInTheDocument();
      });

      const editCreditBtn = screen.getByRole('button', { name: /調整信用額度/ });
      fireEvent.click(editCreditBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const newLimitInput = screen.getByLabelText(/新額度/);
      fireEvent.change(newLimitInput, { target: { value: '600000' } });

      const reasonInput = screen.getByLabelText(/調整原因/);
      fireEvent.change(reasonInput, { target: { value: '業務量增加' } });

      const confirmBtn = screen.getByRole('button', { name: /確認調整/ });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(screen.getByText(/信用額度已更新/)).toBeInTheDocument();
        expect(screen.getByText('信用額度: NT$ 600,000')).toBeInTheDocument();
      });
    });
  });

  describe('Aging Report', () => {
    it('should display aging analysis', async () => {
      renderWithProviders(<AccountsReceivable />);

      const reportTab = screen.getByRole('tab', { name: /帳齡分析/ });
      fireEvent.click(reportTab);

      await waitFor(() => {
        expect(screen.getByText('應收帳款帳齡分析')).toBeInTheDocument();
        expect(screen.getByText('未逾期: NT$ 500,000')).toBeInTheDocument();
        expect(screen.getByText('逾期 1-30 天: NT$ 150,000')).toBeInTheDocument();
      });

      // Check customer breakdown
      expect(screen.getByText('測試客戶A')).toBeInTheDocument();
      expect(screen.getByText('測試客戶B')).toBeInTheDocument();
    });

    it('should filter aging by risk level', async () => {
      renderWithProviders(<AccountsReceivable />);

      const reportTab = screen.getByRole('tab', { name: /帳齡分析/ });
      fireEvent.click(reportTab);

      await waitFor(() => {
        expect(screen.getByText('應收帳款帳齡分析')).toBeInTheDocument();
      });

      const riskFilter = screen.getByLabelText(/風險等級/);
      fireEvent.change(riskFilter, { target: { value: 'high' } });

      await waitFor(() => {
        const customers = screen.getAllByTestId(/customer-/);
        expect(customers.length).toBeLessThan(3);
      });
    });
  });

  describe('Collections Management', () => {
    it('should display collection cases', async () => {
      renderWithProviders(<AccountsReceivable />);

      const collectionTab = screen.getByRole('tab', { name: /催收管理/ });
      fireEvent.click(collectionTab);

      await waitFor(() => {
        expect(screen.getByText('催收案件')).toBeInTheDocument();
        expect(screen.getByText('COLL-2025-08-001')).toBeInTheDocument();
        expect(screen.getByText('進行中')).toBeInTheDocument();
      });
    });

    it('should add collection action', async () => {
      renderWithProviders(<AccountsReceivable />);

      const collectionTab = screen.getByRole('tab', { name: /催收管理/ });
      fireEvent.click(collectionTab);

      await waitFor(() => {
        expect(screen.getByText('COLL-2025-08-001')).toBeInTheDocument();
      });

      const caseRow = screen.getByTestId('collection-COLL_TEST_001');
      fireEvent.click(caseRow);

      const addActionBtn = screen.getByRole('button', { name: /新增行動/ });
      fireEvent.click(addActionBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const actionType = screen.getByLabelText(/行動類型/);
      fireEvent.change(actionType, { target: { value: 'email' } });

      const description = screen.getByLabelText(/描述/);
      fireEvent.change(description, { target: { value: '發送第二次催收通知' } });

      const nextDate = screen.getByLabelText(/下次跟進/);
      fireEvent.change(nextDate, { target: { value: '2025-08-25' } });

      const saveBtn = screen.getByRole('button', { name: /儲存/ });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(screen.getByText(/行動已記錄/)).toBeInTheDocument();
      });
    });

    it('should create payment plan', async () => {
      renderWithProviders(<AccountsReceivable />);

      const collectionTab = screen.getByRole('tab', { name: /催收管理/ });
      fireEvent.click(collectionTab);

      await waitFor(() => {
        expect(screen.getByText('COLL-2025-08-001')).toBeInTheDocument();
      });

      const planBtn = screen.getByRole('button', { name: /建立付款計畫/ });
      fireEvent.click(planBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const installments = screen.getByLabelText(/期數/);
      fireEvent.change(installments, { target: { value: '3' } });

      const startDate = screen.getByLabelText(/開始日期/);
      fireEvent.change(startDate, { target: { value: '2025-09-01' } });

      const createBtn = screen.getByRole('button', { name: /建立計畫/ });
      fireEvent.click(createBtn);

      await waitFor(() => {
        expect(screen.getByText(/付款計畫已建立/)).toBeInTheDocument();
      });
    });

    it('should send dunning letter', async () => {
      renderWithProviders(<AccountsReceivable />);

      const collectionTab = screen.getByRole('tab', { name: /催收管理/ });
      fireEvent.click(collectionTab);

      await waitFor(() => {
        expect(screen.getByText('COLL-2025-08-001')).toBeInTheDocument();
      });

      const dunningBtn = screen.getByRole('button', { name: /發送催收信/ });
      fireEvent.click(dunningBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const templateSelect = screen.getByLabelText(/範本/);
      fireEvent.change(templateSelect, { target: { value: 'reminder_2' } });

      const sendBtn = screen.getByRole('button', { name: /發送/ });
      fireEvent.click(sendBtn);

      await waitFor(() => {
        expect(screen.getByText(/催收信已發送/)).toBeInTheDocument();
      });
    });
  });

  describe('Bank Reconciliation', () => {
    it('should display reconciliation panel', async () => {
      renderWithProviders(<AccountsReceivable />);

      const reconcileTab = screen.getByRole('tab', { name: /銀行對帳/ });
      fireEvent.click(reconcileTab);

      await waitFor(() => {
        expect(screen.getByText('銀行對帳')).toBeInTheDocument();
        expect(screen.getByText('已配對: 45')).toBeInTheDocument();
        expect(screen.getByText('未配對: 3')).toBeInTheDocument();
      });
    });

    it('should match transactions', async () => {
      renderWithProviders(<AccountsReceivable />);

      const reconcileTab = screen.getByRole('tab', { name: /銀行對帳/ });
      fireEvent.click(reconcileTab);

      await waitFor(() => {
        expect(screen.getByText('未配對交易')).toBeInTheDocument();
      });

      const unmatchedTab = screen.getByRole('tab', { name: /未配對/ });
      fireEvent.click(unmatchedTab);

      const bankTrans = screen.getByTestId('bank-trans-001');
      fireEvent.click(bankTrans);

      const paymentSelect = screen.getByLabelText(/選擇付款/);
      fireEvent.change(paymentSelect, { target: { value: 'PAY_001' } });

      const matchBtn = screen.getByRole('button', { name: /配對/ });
      fireEvent.click(matchBtn);

      await waitFor(() => {
        expect(screen.getByText(/交易已配對/)).toBeInTheDocument();
      });
    });

    it('should complete reconciliation', async () => {
      renderWithProviders(<AccountsReceivable />);

      const reconcileTab = screen.getByRole('tab', { name: /銀行對帳/ });
      fireEvent.click(reconcileTab);

      await waitFor(() => {
        expect(screen.getByText('銀行對帳')).toBeInTheDocument();
      });

      const completeBtn = screen.getByRole('button', { name: /完成對帳/ });
      fireEvent.click(completeBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const notes = screen.getByLabelText(/備註/);
      fireEvent.change(notes, { target: { value: '對帳完成' } });

      const confirmBtn = screen.getByRole('button', { name: /確認完成/ });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(screen.getByText(/對帳已完成/)).toBeInTheDocument();
      });
    });
  });

  describe('Tax Reporting', () => {
    it('should generate tax report', async () => {
      renderWithProviders(<AccountsReceivable />);

      const taxTab = screen.getByRole('tab', { name: /稅務報表/ });
      fireEvent.click(taxTab);

      await waitFor(() => {
        expect(screen.getByText('稅務報表')).toBeInTheDocument();
      });

      const generateBtn = screen.getByRole('button', { name: /產生報表/ });
      fireEvent.click(generateBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const periodSelect = screen.getByLabelText(/期間/);
      fireEvent.change(periodSelect, { target: { value: '2025-08' } });

      const typeSelect = screen.getByLabelText(/報表類型/);
      fireEvent.change(typeSelect, { target: { value: 'output_tax' } });

      const confirmBtn = screen.getByRole('button', { name: /產生/ });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(screen.getByText(/報表已產生/)).toBeInTheDocument();
        expect(screen.getByText('總銷售額: NT$ 2,000,000')).toBeInTheDocument();
        expect(screen.getByText('應繳稅額: NT$ 90,000')).toBeInTheDocument();
      });
    });

    it('should file tax report', async () => {
      renderWithProviders(<AccountsReceivable />);

      const taxTab = screen.getByRole('tab', { name: /稅務報表/ });
      fireEvent.click(taxTab);

      await waitFor(() => {
        expect(screen.getByText('稅務報表')).toBeInTheDocument();
      });

      const fileBtn = screen.getByRole('button', { name: /申報/ });
      fireEvent.click(fileBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const confirmBtn = screen.getByRole('button', { name: /確認申報/ });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(screen.getByText(/申報成功/)).toBeInTheDocument();
        expect(screen.getByText(/參考編號: TAX-REF-/)).toBeInTheDocument();
      });
    });
  });
});