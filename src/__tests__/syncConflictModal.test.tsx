import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SyncConflictModal } from '../components/modals/SyncConflictModal';

const LOCAL_TIME = '2024-01-15T10:30:00Z';
const REMOTE_TIME = '2024-01-14T08:00:00Z';

const formattedLocal = new Date(LOCAL_TIME).toLocaleString();
const formattedRemote = new Date(REMOTE_TIME).toLocaleString();

describe('SyncConflictModal', () => {
  const onResolve = vi.fn();
  const onClose = vi.fn();

  const renderModal = () =>
    render(
      <SyncConflictModal
        localTime={LOCAL_TIME}
        remoteTime={REMOTE_TIME}
        onResolve={onResolve}
        onClose={onClose}
      />,
    );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the modal with correct data-testid', () => {
    renderModal();
    expect(screen.getByTestId('sync-conflict-modal')).toBeInTheDocument();
  });

  it('renders the title "Xung đột dữ liệu"', () => {
    renderModal();
    expect(screen.getByText('Xung đột dữ liệu')).toBeInTheDocument();
  });

  it('renders the description text', () => {
    renderModal();
    expect(
      screen.getByText('Dữ liệu cục bộ và dữ liệu đám mây khác nhau. Bạn muốn giữ phiên bản nào?'),
    ).toBeInTheDocument();
  });

  it('renders "Dữ liệu cục bộ" label', () => {
    renderModal();
    expect(screen.getByText('Dữ liệu cục bộ')).toBeInTheDocument();
  });

  it('renders "Dữ liệu đám mây" label', () => {
    renderModal();
    expect(screen.getByText('Dữ liệu đám mây')).toBeInTheDocument();
  });

  it('displays the formatted local time', () => {
    renderModal();
    expect(screen.getByText(formattedLocal)).toBeInTheDocument();
  });

  it('displays the formatted remote time', () => {
    renderModal();
    expect(screen.getByText(formattedRemote)).toBeInTheDocument();
  });

  it('formats ISO date strings via toLocaleString', () => {
    renderModal();
    const expectedLocal = new Date('2024-01-15T10:30:00Z').toLocaleString();
    const expectedRemote = new Date('2024-01-14T08:00:00Z').toLocaleString();
    expect(screen.getByText(expectedLocal)).toBeInTheDocument();
    expect(screen.getByText(expectedRemote)).toBeInTheDocument();
  });

  it('calls onResolve("local") when "Giữ cục bộ" button is clicked', () => {
    renderModal();
    fireEvent.click(screen.getByText('Giữ cục bộ'));
    expect(onResolve).toHaveBeenCalledTimes(1);
    expect(onResolve).toHaveBeenCalledWith('local');
  });

  it('calls onResolve("cloud") when "Dùng dữ liệu đám mây" button is clicked', () => {
    renderModal();
    fireEvent.click(screen.getByText('Dùng dữ liệu đám mây'));
    expect(onResolve).toHaveBeenCalledTimes(1);
    expect(onResolve).toHaveBeenCalledWith('cloud');
  });

  it('calls onClose when cancel button "Hủy" is clicked', () => {
    renderModal();
    fireEvent.click(screen.getByText('Hủy'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('has correct data-testid on the keep-local button', () => {
    renderModal();
    expect(screen.getByTestId('btn-keep-local')).toBeInTheDocument();
  });

  it('has correct data-testid on the use-cloud button', () => {
    renderModal();
    expect(screen.getByTestId('btn-use-cloud')).toBeInTheDocument();
  });

  it('has correct data-testid on the cancel button', () => {
    renderModal();
    expect(screen.getByTestId('btn-cancel-sync')).toBeInTheDocument();
  });
});
