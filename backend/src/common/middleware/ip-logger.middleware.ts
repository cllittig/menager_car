import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

interface ExtendedRequest extends Request {
  realIp?: string;
}

@Injectable()
export class IpLoggerMiddleware implements NestMiddleware {
  use(req: ExtendedRequest, res: Response, next: NextFunction) {

    const forwarded = req.headers['x-forwarded-for'] as string;
    const real = req.headers['x-real-ip'] as string;
    const cloudflare = req.headers['cf-connecting-ip'] as string;

    let clientIp = req.ip;

    if (cloudflare) {
      clientIp = cloudflare;
    } else if (real) {
      clientIp = real;
    } else if (forwarded) {

      clientIp = forwarded.split(',')[0].trim();
    }


    req.realIp = clientIp;

    next();
  }
} 