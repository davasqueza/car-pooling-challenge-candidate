import { BaseException } from './base.exception';
import { GroupDto } from '../dto/group.dto';

export class PeopleGroupNotFoundException extends BaseException {
  constructor(message: string, groupId: GroupDto['id']) {
    super(message, 'PeopleGroupNotFound', groupId.toString());
  }
}
