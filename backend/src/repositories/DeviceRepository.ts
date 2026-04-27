import { SqliteRepository } from './SqliteRepository';
import { Device } from '../types';

class DeviceRepository extends SqliteRepository<Device> {
  constructor() {
    super('devices', 'd');
  }
}

export const deviceRepository = new DeviceRepository();
