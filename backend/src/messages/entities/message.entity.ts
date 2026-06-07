import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'sender_id' })
  senderId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @Column({ name: 'receiver_id' })
  receiverId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'receiver_id' })
  receiver: User;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'is_read', type: 'boolean', default: false })
  isRead: boolean;

  @Column({ name: 'send_time', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  sendTime: Date;

  @Column({ name: 'related_type', length: 50, nullable: true })
  relatedType: string;

  @Column({ name: 'related_id', type: 'int', nullable: true })
  relatedId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
