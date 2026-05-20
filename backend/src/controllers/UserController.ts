import { Request, Response } from 'express';
import userService from '../services/UserService';

const userController = {
  list(_req: Request, res: Response): void {
    res.json(userService.findAll());
  },

  async create(req: Request, res: Response): Promise<void> {
    const { username, password, displayName, email } = req.body as {
      username: string;
      password: string;
      displayName: string;
      email?: string;
    };
    try {
      const user = await userService.create({ username, password, displayName, email });
      res.status(201).json(user);
    } catch (e) {
      const status = (e as { status?: number }).status ?? 500;
      res.status(status).json({ error: (e as Error).message });
    }
  },

  async remove(req: Request, res: Response): Promise<void> {
    await userService.delete(req.params.id);
    res.status(204).send();
  },
};

export default userController;
