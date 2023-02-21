import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateHouseDto } from 'src/module/house/dto/create-house.dto';
import { House } from 'src/entities/house.entity';
import { HouseMember } from 'src/entities/houseMember.entity';
import { User } from 'src/entities/user.entity';
import { UserService } from 'src/module/user/user.service';
import { DataSource, Repository } from 'typeorm';
import { UpdateHouseDto } from './dto/update-house.dto';
import { SoftDeleteQueryBuilder } from 'typeorm/query-builder/SoftDeleteQueryBuilder';
import { CreateHouseworkDto } from '../housework/dto/createHousework.dto';
import { Housework } from 'src/entities/housework.entity';
import { Role } from 'src/entities/enum/role.enum';

@Injectable()
export class HouseService {
  constructor(
    @InjectRepository(House)
    private readonly houseRepository: Repository<House>,
    @InjectRepository(HouseMember)
    private readonly houseMemberRepository: Repository<HouseMember>,
    private readonly dataSource: DataSource,
  ) {}

  async createNewHouse(
    createHouseDto: CreateHouseDto,
    user: User,
  ): Promise<HouseMember> {
    return this.dataSource.transaction(async (manager) => {
      const houseEntity = this.houseRepository.create({
        name: createHouseDto.name,
      });
      const house = await manager.save(houseEntity);
      const houseMemberEntity = new HouseMember();
      Object.assign(houseMemberEntity, {
        house,
        user,
        role: Role.Admin,
      } as Partial<HouseMember>);
      return manager.save(houseMemberEntity);
    });
  }

  async getAllHouseByUser(user: User) {
    return this.houseMemberRepository.find({
      where: {
        user: { id: user.id },
      },
      relations: ['user', 'house'],
    });
  }

  async getHouseByHouseId(houseId: number) {
    try {
      return await this.houseRepository.findOneOrFail({
        relations: {
          houseMembers: {
            user: true,
          },
        },
        where: {
          id: houseId,
        },
        transaction: true,
      });
    } catch (e) {
      throw new NotFoundException(e.message);
    }
  }

  async renameHouse(houseId: number, updateHouseDto: UpdateHouseDto) {
    this.houseRepository.update(houseId, { name: updateHouseDto.houseName });
  }

  async softDeleteHouse(houseId: number) {
    const house = await this.getHouseByHouseId(houseId);
    await this.houseRepository.softRemove(house);
  }
}
