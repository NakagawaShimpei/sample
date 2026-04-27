import { Request, Response } from 'express';
import userService from '../services/UserService';

const userController = {
  list(_req: Request, res: Response): void {
    res.json(userService.findAll());
  },

  async create(req: Request, res: Response): Promise<void> {
    const { username, password, displayName } = req.body as {
      username: string;
      password: string;
      displayName: string;
    };
    const user = await userService.create({ username, password, displayName });
    res.status(201).json(user);
  },

  async remove(req: Request, res: Response): Promise<void> {
    await userService.delete(req.params.id);
    res.status(204).send();
  },
};

export default userController;
