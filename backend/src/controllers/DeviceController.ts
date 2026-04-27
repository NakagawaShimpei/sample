import { Request, Response } from 'express';
import deviceService from '../services/DeviceService';
import { Device, DeviceStatus } from '../types';

const deviceController = {
  list(_req: Request, res: Response): void {
    res.json(deviceService.findAll());
  },

  async create(req: Request, res: Response): Promise<void> {
    const data = req.body as Omit<Device, 'id'>;
    const device = await deviceService.create(data);
    res.status(201).json(device);
  },

  async updateStatus(req: Request, res: Response): Promise<void> {
    const { status } = req.body as { status: DeviceStatus };
    const updated = await deviceService.updateStatus(req.params.id, status);
    if (!updated) {
      res.status(404).json({ error: 'デバイスが見つかりません' });
      return;
    }
    res.json(updated);
  },

  async remove(req: Request, res: Response): Promise<void> {
    await deviceService.delete(req.params.id);
    res.status(204).send();
  },
};

export default deviceController;
