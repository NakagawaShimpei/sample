import { deviceRepository } from '../repositories/DeviceRepository';
import { loanRepository } from '../repositories/LoanRepository';
import { Device, DeviceStatus } from '../types';

const deviceService = {
  findAll(): Device[] {
    return deviceRepository.findAll();
  },

  async create(data: Omit<Device, 'id'>): Promise<Device> {
    return deviceRepository.create(data);
  },

  async updateStatus(id: string, status: DeviceStatus): Promise<Device | null> {
    return deviceRepository.update(id, { status });
  },

  async delete(id: string): Promise<void> {
    await loanRepository.deleteWhere((l) => l.deviceId === id);
    await deviceRepository.delete(id);
  },
};

export default deviceService;
