/**
 * @author vtron-nas
 * 路由聚合
 */
import authRouter from './auth';
import fsRouter from './fs';
import trashRouter from './trash';
import shareRouter from './share';
import storageRouter from './storage';

export const routers = [authRouter, fsRouter, trashRouter, shareRouter, storageRouter];
