import { Request, Response } from 'express';
import roomService from '../services/RoomService';
import { Room } from '../types';

const roomController = {
  list(_req: Request, res: Response): void {
    res.json(roomService.findAll());
  },

  async create(req: Request, res: Response): Promise<void> {
    const data = req.body as Omit<Room, 'id'>;
    const room = await roomService.create(data);
    res.status(201).json(room);
  },

  async remove(req: Request, res: Response): Promise<void> {
    await roomService.delete(req.params.id);
    res.status(204).send();
  },
};

export default roomController;
