import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { googleConfiguration } from 'src/config/google.config';
import { LoginResponse } from 'src/interfaces/login-response.interface';
import { UserService } from 'src/user/user.service';
import { AuthService } from '../auth.service';
import { RequestLoginUserDto } from '../dto/request-login-user.dto';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    @Inject(googleConfiguration.KEY)
    googleConfig: ConfigType<typeof googleConfiguration>,
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {
    super({
      clientID: googleConfig.clientId,
      clientSecret: googleConfig.clientSecret,
      callbackURL: googleConfig.callbackURL,
      scope: ['profile', 'email'],
    });
  }
  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails } = profile;

    const userInfo: RequestLoginUserDto = {
      email: emails[0].value,
      username: `${name.familyName} ${name.givenName}`,
    };

    // TODO: 메서드 리팩토링 하기
    const user = await this.userService.registerUser(userInfo);
    const tokens = await this.authService.generateTokensAndSaveToRedis(user.id);

    const result: LoginResponse = {
      user,
      message: 'login seccuess',
      tokens,
    };
    done(null, result);
  }
}
