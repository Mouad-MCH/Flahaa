import { describe, it, expect, vi, beforeEach } from 'vitest';
import Worker from '../../models/Worker.js';
import Attendance from '../../models/Attendance.js';
import Payroll from '../../models/Payroll.js';
import {
  calculatePayrollService,
  getPayrollsService,
  getPayrollByWorkerService,
  updatePayrollStausService,
  getMyPayrollsService,
} from '../../services/pyroll.service.js';

vi.mock('../../models/Worker.js', () => ({
  default: {
    findOne: vi.fn(),
    aggregate: vi.fn(),
  },
}));

vi.mock('../../models/Attendance.js', () => ({
  default: {
    aggregate: vi.fn(),
  },
}));

vi.mock('../../models/Payroll.js', () => ({
  default: {
    findOneAndUpdate: vi.fn(),
    aggregate: vi.fn(),
    findOne: vi.fn(),
  },
}));

const populateMock = (resolvedValue) => {
  const query = {
    populate: vi.fn(() => query),
    then: (resolve, reject) => Promise.resolve(resolvedValue).then(resolve, reject),
  };
  return query;
};

const facetResult = (records, total) => [{ records, total }];

const findStage = (stages, key) => stages.find((stage) => key in stage);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('calculatePayrollService', () => {
  const farmId = 'farm-1';
  const baseData = { worker_id: 'w1', month: 8, year: 2026, bonuses: 100, deductions: 50, notes: 'n' };

  it('throws a 404 when the worker is not found on this farm', async () => {
    Worker.findOne.mockResolvedValueOnce(null);

    await expect(calculatePayrollService(farmId, baseData)).rejects.toMatchObject({
      statusCode: 404,
      message: 'Worker not found',
    });
    expect(Attendance.aggregate).not.toHaveBeenCalled();
    expect(Payroll.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('computes working_days, base_salary and net_salary from attendance, rate and advances', async () => {
    Worker.findOne.mockResolvedValueOnce({ _id: 'w1', daily_rate: 100 });
    Attendance.aggregate.mockResolvedValueOnce([{ _id: null, total: 20 }]);
    Worker.aggregate.mockResolvedValueOnce([{ _id: null, total: 150 }]);
    const updated = { _id: 'p1', net_salary: 1900 };
    Payroll.findOneAndUpdate.mockReturnValueOnce(populateMock(updated));

    const result = await calculatePayrollService(farmId, baseData);

    expect(Payroll.findOneAndUpdate).toHaveBeenCalledWith(
      { worker_id: 'w1', month: 8, year: 2026 },
      expect.objectContaining({
        farm_id: farmId,
        worker_id: 'w1',
        month: 8,
        year: 2026,
        working_days: 20,
        daily_rate: 100,
        bonuses: 100,
        deductions: 50,
        advances_total: 150,
        net_salary: 1900, // 100*20 + 100 - 150 - 50
        notes: 'n',
        calculated_at: expect.any(Date),
      }),
      { upsert: true, new: true, runValidators: true }
    );
    expect(result).toBe(updated);
  });

  it('defaults working_days and advances_total to 0 when the aggregations find nothing', async () => {
    Worker.findOne.mockResolvedValueOnce({ _id: 'w1', daily_rate: 100 });
    Attendance.aggregate.mockResolvedValueOnce([]);
    Worker.aggregate.mockResolvedValueOnce([]);
    Payroll.findOneAndUpdate.mockReturnValueOnce(populateMock({ _id: 'p1' }));

    await calculatePayrollService(farmId, { ...baseData, bonuses: 0, deductions: 0 });

    expect(Payroll.findOneAndUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ working_days: 0, advances_total: 0, net_salary: 0 }),
      expect.anything()
    );
  });

  it('floors net_salary at 0 when deductions and advances exceed earnings', async () => {
    Worker.findOne.mockResolvedValueOnce({ _id: 'w1', daily_rate: 10 });
    Attendance.aggregate.mockResolvedValueOnce([{ _id: null, total: 1 }]); // base_salary = 10
    Worker.aggregate.mockResolvedValueOnce([{ _id: null, total: 100 }]); // advances_total = 100
    Payroll.findOneAndUpdate.mockReturnValueOnce(populateMock({ _id: 'p1' }));

    await calculatePayrollService(farmId, { ...baseData, bonuses: 0, deductions: 50 });

    expect(Payroll.findOneAndUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ net_salary: 0 }),
      expect.anything()
    );
  });

  it('populates worker details on the upserted payroll', async () => {
    Worker.findOne.mockResolvedValueOnce({ _id: 'w1', daily_rate: 100 });
    Attendance.aggregate.mockResolvedValueOnce([]);
    Worker.aggregate.mockResolvedValueOnce([]);
    const query = populateMock({ _id: 'p1' });
    Payroll.findOneAndUpdate.mockReturnValueOnce(query);

    await calculatePayrollService(farmId, baseData);

    expect(query.populate).toHaveBeenCalledWith('worker_id', 'name CIN avatar daily_rate contract_type');
  });
});

describe('getPayrollsService', () => {
  const farmId = 'farm-1';

  it('builds the match query from the optional filters', async () => {
    Payroll.aggregate.mockResolvedValueOnce(facetResult([], []));

    await getPayrollsService(farmId, {
      month: 8,
      year: 2026,
      status: 'paid',
      worker_id: 'w1',
      page: 1,
      limit: 10,
    });

    const pipeline = Payroll.aggregate.mock.calls[0][0];
    expect(pipeline[0].$match).toEqual({
      farm_id: farmId,
      month: 8,
      year: 2026,
      status: 'paid',
      worker_id: 'w1',
    });
  });

  it('only matches by farm_id when no optional filters are given', async () => {
    Payroll.aggregate.mockResolvedValueOnce(facetResult([], []));

    await getPayrollsService(farmId, { page: 1, limit: 10 });

    const pipeline = Payroll.aggregate.mock.calls[0][0];
    expect(pipeline[0].$match).toEqual({ farm_id: farmId });
  });

  it('computes skip from page and limit', async () => {
    Payroll.aggregate.mockResolvedValueOnce(facetResult([], []));

    await getPayrollsService(farmId, { page: 3, limit: 10 });

    const pipeline = Payroll.aggregate.mock.calls[0][0];
    const stages = pipeline[1].$facet.records;
    expect(findStage(stages, '$skip').$skip).toBe(20);
    expect(findStage(stages, '$limit').$limit).toBe(10);
  });

  it('returns pagination totals and records from the facet result', async () => {
    Payroll.aggregate.mockResolvedValueOnce(facetResult([{ _id: 'p1' }], [{ total: 25 }]));

    const result = await getPayrollsService(farmId, { page: 1, limit: 10 });

    expect(result.pagination).toEqual({ total: 25, page: 1, limit: 10, pages: 3 });
    expect(result.records).toEqual([{ _id: 'p1' }]);
  });

  it('defaults total and pages to 0 when nothing matches', async () => {
    Payroll.aggregate.mockResolvedValueOnce(facetResult([], []));

    const result = await getPayrollsService(farmId, { page: 1, limit: 10 });

    expect(result.pagination).toEqual({ total: 0, page: 1, limit: 10, pages: 0 });
  });
});

describe('getPayrollByWorkerService', () => {
  const farmId = 'farm-1';

  it('throws a 404 when no payroll record exists yet', async () => {
    Payroll.findOne.mockReturnValueOnce(populateMock(null));

    await expect(
      getPayrollByWorkerService(farmId, { worker_id: 'w1', month: 8, year: 2026 })
    ).rejects.toMatchObject({
      statusCode: 404,
      message: 'Payroll record not found. Calculate first.',
    });
  });

  it('scopes the lookup to farm, worker, month and year, and returns the populated record', async () => {
    const payroll = { _id: 'p1' };
    Payroll.findOne.mockReturnValueOnce(populateMock(payroll));

    const result = await getPayrollByWorkerService(farmId, { worker_id: 'w1', month: 8, year: 2026 });

    expect(Payroll.findOne).toHaveBeenCalledWith({ farm_id: farmId, worker_id: 'w1', month: 8, year: 2026 });
    expect(result).toBe(payroll);
  });
});

describe('updatePayrollStausService', () => {
  const farmId = 'farm-1';

  it('throws a 404 when no payroll record matches', async () => {
    Payroll.findOneAndUpdate.mockReturnValueOnce(populateMock(null));

    await expect(updatePayrollStausService(farmId, 'p1', { status: 'paid' })).rejects.toMatchObject({
      statusCode: 404,
      message: 'Payroll record not found',
    });
  });

  it('sets paid_at when marking the record as paid', async () => {
    Payroll.findOneAndUpdate.mockReturnValueOnce(populateMock({ _id: 'p1', status: 'paid' }));

    await updatePayrollStausService(farmId, 'p1', { status: 'paid' });

    expect(Payroll.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'p1', farm_id: farmId },
      { status: 'paid', paid_at: expect.any(Date) },
      { new: true, runValidators: true }
    );
  });

  it('does not set paid_at for non-paid statuses', async () => {
    Payroll.findOneAndUpdate.mockReturnValueOnce(populateMock({ _id: 'p1', status: 'pending' }));

    await updatePayrollStausService(farmId, 'p1', { status: 'pending' });

    expect(Payroll.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'p1', farm_id: farmId },
      { status: 'pending' },
      { new: true, runValidators: true }
    );
  });
});

describe('getMyPayrollsService', () => {
  it('throws a 403 when the account is not linked to a worker record', async () => {
    await expect(getMyPayrollsService({}, {})).rejects.toMatchObject({
      statusCode: 403,
      message: 'This account is not linked to a worker record',
    });
    expect(Payroll.aggregate).not.toHaveBeenCalled();
  });

  it('matches by worker_id only when no month/year filter is given', async () => {
    Payroll.aggregate.mockResolvedValueOnce(facetResult([], []));

    await getMyPayrollsService({ worker_id: 'w1' }, {});

    const pipeline = Payroll.aggregate.mock.calls[0][0];
    expect(pipeline[0].$match).toEqual({ worker_id: 'w1' });
  });

  it('adds month/year to the match query when given', async () => {
    Payroll.aggregate.mockResolvedValueOnce(facetResult([], []));

    await getMyPayrollsService({ worker_id: 'w1' }, { month: 8, year: 2026 });

    const pipeline = Payroll.aggregate.mock.calls[0][0];
    expect(pipeline[0].$match).toEqual({ worker_id: 'w1', month: 8, year: 2026 });
  });

  it('computes skip from page and limit and returns pagination with records', async () => {
    Payroll.aggregate.mockResolvedValueOnce(facetResult([{ _id: 'p1' }], [{ total: 5 }]));

    const result = await getMyPayrollsService({ worker_id: 'w1' }, { page: 2, limit: 2 });

    const pipeline = Payroll.aggregate.mock.calls[0][0];
    const stages = pipeline[1].$facet.records;
    expect(findStage(stages, '$skip').$skip).toBe(2);
    expect(result.pagination).toEqual({ total: 5, page: 2, limit: 2, pages: 3 });
    expect(result.records).toEqual([{ _id: 'p1' }]);
  });

  it('defaults total and pages to 0 when nothing matches', async () => {
    Payroll.aggregate.mockResolvedValueOnce(facetResult([], []));

    const result = await getMyPayrollsService({ worker_id: 'w1' }, { page: 1, limit: 20 });

    expect(result.pagination).toEqual({ total: 0, page: 1, limit: 20, pages: 0 });
  });
});
