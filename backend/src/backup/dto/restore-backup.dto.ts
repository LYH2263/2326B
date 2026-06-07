import { IsString, IsNotEmpty } from 'class-validator';

export class RestoreBackupDto {
  @IsString()
  @IsNotEmpty()
  confirmText: string;
}
