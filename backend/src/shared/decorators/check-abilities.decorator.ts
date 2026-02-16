import { SetMetadata } from '@nestjs/common';
import { Actions, Subjects } from '../casl/casl-ability.factory';

export interface RequiredRule {
  action: Actions;
  subject: Subjects;
}

export const CHECK_ABILITY = 'check_ability';

/**
 * Route decorator to check CASL permissions
 * Usage: @CheckAbilities({ action: 'read', subject: 'Task' })
 */
export const CheckAbilities = (...requirements: RequiredRule[]) =>
  SetMetadata(CHECK_ABILITY, requirements);
