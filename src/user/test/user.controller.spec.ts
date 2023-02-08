import { Test, TestingModule } from '@nestjs/testing';
import { HouseMember } from 'src/entities/houseMember.entity';
import { User } from 'src/entities/user.entity';
import { UserController } from '../user.controller';
import { UserService } from '../user.service';

const mockUser = {
  id: 'uuid',
  email: 'test@abcd.com',
  username: 'test user',
  housemember: [new HouseMember()],
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
} satisfies User;

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            findUserById: jest
              .fn()
              .mockImplementation((userId: string) =>
                Promise.resolve(mockUser),
              ),
          },
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getById', () => {
    it('should get a single user profile', async () => {
      await expect(controller.getUserProfile('uuid')).resolves.toEqual(
        mockUser,
      );
    });
  });
});
