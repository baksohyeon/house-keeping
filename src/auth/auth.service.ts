import {
  CACHE_MANAGER,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { compare, hash } from 'bcrypt';
import { CookieOptions } from 'express';
import { User } from 'src/entities/user.entity';
import {
  AccessCookieConfig,
  RefreshCookieConfig,
} from 'src/types/cookie-config.interface';
import { Repository } from 'typeorm';
import { LoginRequestUserDto } from './dto/login-request.dto';
import ms from 'ms';
import { v4 as uuidv4 } from 'uuid';
import { FreshTokens } from 'src/types/fresh-tokens.interface';
import {
  AccessTokenPayload,
  AccessTokenUserPayload,
  RefreshTokenPayload,
} from 'src/types/type';
import { Cache } from 'cache-manager';
import { json } from 'stream/consumers';
import { redisPayload } from 'src/types/redis.type';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private readonly logger = new Logger(AuthService.name);

  private generateRefreshToken(payload: AccessTokenUserPayload) {
    // include the necessary data in the token payload
    const refreshTokenPayload = {
      userId: payload.userId,
      tokenType: 'refresh',
    };

    // generate a unique identifier for this refresh token
    const jti = uuidv4();
    const refreshToken = this.jwtService.sign(refreshTokenPayload, {
      secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn: ms(
        this.configService.get<number>('JWT_REFRESH_TOKEN_EXPIRES_IN'),
      ),
      issuer: 'dorito',
      audience: [this.configService.get<string>('FRONTEND_URL')],
      jwtid: jti,
    });
    return {
      token: refreshToken,
      jti,
    };
  }

  private generateAccessToken(
    payload: AccessTokenUserPayload,
    refreshTokenId: string,
  ) {
    // used to revoke individual tokens
    const jti = uuidv4();
    const accessTokenPayload = {
      ...payload,
      refreshTokenId,
      tokenType: 'access',
    };
    const accessToken = this.jwtService.sign(accessTokenPayload, {
      secret: this.configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
      expiresIn: ms(
        this.configService.get<number>('JWT_ACCESS_TOKEN_EXPIRES_IN_MINUTES'),
      ),
      issuer: 'dorito',
      audience: [this.configService.get<string>('FRONTEND_URL')],
      jwtid: jti,
    });
    return {
      token: accessToken,
      jti,
    };
  }

  generateTokens(payload: AccessTokenUserPayload): FreshTokens {
    const refreshToken = this.generateRefreshToken(payload);
    const accessToken = this.generateAccessToken(payload, refreshToken.jti);
    return {
      accessToken,
      refreshToken,
    };
  }
}
