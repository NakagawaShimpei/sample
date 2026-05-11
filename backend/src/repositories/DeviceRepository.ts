import { Device } from '../types';
import { SqliteRepository } from './SqliteRepository';

class DeviceRepository extends SqliteRepository<Device> {
  constructor() {
    super('devices', 'd');
  }
}

export const deviceRepository = new DeviceRepository();
