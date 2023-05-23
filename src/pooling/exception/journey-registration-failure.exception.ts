import { BaseException } from './base.exception';
import { GroupDto } from '../dto/group.dto';

export class JourneyRegistrationFailureException extends BaseException {
  constructor(message: string, groupId: GroupDto['id']) {
    super(message, 'JourneyRegistrationFailure', groupId.toString());
  }
}
