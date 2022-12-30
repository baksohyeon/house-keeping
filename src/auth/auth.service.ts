import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import { UserInfoDto } from './dto/user-info.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  googleLogin(req) {
    if (!req.user) {
      throw new HttpException('No user from google', HttpStatus.NOT_FOUND);
    }
    return {
      message: 'User information from google',
      user: req.user,
    };
  }
  // async validateUser(userInfo: UserInfoDto) {
  //   console.log('AuthService - userInfo:', userInfo);
  //   const user = await this.userRepository.findOneBy({
  //     email: userInfo.email,
  //   });
  //   console.log('AuthService - user:', user);
  //   if (!user) {
  //     console.log('there is no user');
  //     const newUser = this.userRepository.create(userInfo);
  //     return this.userRepository.save(newUser);
  //   }
  //   return user;
  // }
}
