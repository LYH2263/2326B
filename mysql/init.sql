-- 实验室动物信息管理系统 数据库初始化脚本
-- Database: lab_animal_db

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

USE lab_animal_db;

-- ========================================
-- 用户表
-- ========================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
  `password` VARCHAR(255) NOT NULL COMMENT '密码(bcrypt)',
  `name` VARCHAR(100) DEFAULT NULL COMMENT '显示名称',
  `role` ENUM('admin', 'user') NOT NULL DEFAULT 'user' COMMENT '角色',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ========================================
-- 动物基本信息表
-- ========================================
CREATE TABLE IF NOT EXISTS `animals` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL COMMENT '动物名称/编号',
  `species` VARCHAR(50) NOT NULL COMMENT '物种',
  `breed` VARCHAR(50) DEFAULT NULL COMMENT '品系/品种',
  `gender` ENUM('male', 'female', 'unknown') NOT NULL DEFAULT 'unknown' COMMENT '性别',
  `birth_date` DATE DEFAULT NULL COMMENT '出生日期',
  `weight` DECIMAL(10, 2) DEFAULT NULL COMMENT '体重(g)',
  `status` ENUM('healthy', 'sick', 'in_experiment', 'deceased', 'quarantine') NOT NULL DEFAULT 'healthy' COMMENT '状态',
  `cage_number` VARCHAR(50) DEFAULT NULL COMMENT '笼号',
  `rfid_tag` VARCHAR(100) DEFAULT NULL COMMENT 'RFID标签',
  `source` VARCHAR(200) DEFAULT NULL COMMENT '来源',
  `description` TEXT COMMENT '备注描述',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_species` (`species`),
  INDEX `idx_status` (`status`),
  INDEX `idx_cage` (`cage_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='动物基本信息表';

-- ========================================
-- 健康记录表
-- ========================================
CREATE TABLE IF NOT EXISTS `health_records` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `animal_id` INT NOT NULL COMMENT '动物ID',
  `check_date` DATE NOT NULL COMMENT '检查日期',
  `temperature` DECIMAL(4, 1) DEFAULT NULL COMMENT '体温(℃)',
  `weight` DECIMAL(10, 2) DEFAULT NULL COMMENT '体重(g)',
  `heart_rate` INT DEFAULT NULL COMMENT '心率(次/分)',
  `respiratory_rate` INT DEFAULT NULL COMMENT '呼吸频率(次/分)',
  `condition` ENUM('normal', 'abnormal', 'critical') NOT NULL DEFAULT 'normal' COMMENT '健康状况',
  `diagnosis` TEXT COMMENT '诊断',
  `treatment` TEXT COMMENT '治疗方案',
  `veterinarian` VARCHAR(100) DEFAULT NULL COMMENT '兽医',
  `next_check_date` DATE DEFAULT NULL COMMENT '下次检查日期',
  `notes` TEXT COMMENT '备注',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`animal_id`) REFERENCES `animals`(`id`) ON DELETE CASCADE,
  INDEX `idx_animal_id` (`animal_id`),
  INDEX `idx_check_date` (`check_date`),
  INDEX `idx_condition` (`condition`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='健康记录表';

-- ========================================
-- 实验项目表
-- ========================================
CREATE TABLE IF NOT EXISTS `experiments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(200) NOT NULL COMMENT '实验名称',
  `project_code` VARCHAR(50) NOT NULL COMMENT '项目编号',
  `description` TEXT COMMENT '实验描述',
  `start_date` DATE DEFAULT NULL COMMENT '开始日期',
  `end_date` DATE DEFAULT NULL COMMENT '结束日期',
  `status` ENUM('planning', 'in_progress', 'completed', 'suspended', 'cancelled') NOT NULL DEFAULT 'planning' COMMENT '状态',
  `researcher` VARCHAR(100) DEFAULT NULL COMMENT '负责研究员',
  `department` VARCHAR(100) DEFAULT NULL COMMENT '所属部门',
  `notes` TEXT COMMENT '备注',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_project_code` (`project_code`),
  INDEX `idx_status` (`status`),
  INDEX `idx_researcher` (`researcher`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='实验项目表';

-- ========================================
-- 实验-动物关联表
-- ========================================
CREATE TABLE IF NOT EXISTS `experiment_animals` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `experiment_id` INT NOT NULL COMMENT '实验ID',
  `animal_id` INT NOT NULL COMMENT '动物ID',
  `role` VARCHAR(50) DEFAULT 'subject' COMMENT '角色(实验组/对照组)',
  `join_date` DATE DEFAULT NULL COMMENT '加入日期',
  `leave_date` DATE DEFAULT NULL COMMENT '离开日期',
  `notes` TEXT COMMENT '备注',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`experiment_id`) REFERENCES `experiments`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`animal_id`) REFERENCES `animals`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_exp_animal` (`experiment_id`, `animal_id`),
  INDEX `idx_experiment_id` (`experiment_id`),
  INDEX `idx_animal_id` (`animal_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='实验-动物关联表';

-- ========================================
-- 种子数据：实验-动物关联
-- ========================================
INSERT INTO `experiment_animals` (`experiment_id`, `animal_id`, `role`, `join_date`, `leave_date`, `notes`) VALUES
(1, 3, 'treatment_group', '2025-11-01', NULL, '治疗组 - 高剂量'),
(1, 4, 'control_group', '2025-11-01', NULL, '对照组 - 溶媒对照'),
(2, 6, 'treatment_group', '2025-10-15', NULL, '治疗组 - 中剂量'),
(3, 8, 'treatment_group', '2025-12-01', NULL, '模型组'),
(5, 11, 'treatment_group', '2025-09-01', '2025-12-30', '治疗组'),
(5, 12, 'control_group', '2025-09-01', '2025-12-30', '对照组');

-- ========================================
-- 实验里程碑表
-- ========================================
CREATE TABLE IF NOT EXISTS `experiment_milestones` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `experiment_id` INT NOT NULL COMMENT '实验ID',
  `name` VARCHAR(200) NOT NULL COMMENT '里程碑名称',
  `planned_date` DATE NOT NULL COMMENT '计划日期',
  `actual_date` DATE DEFAULT NULL COMMENT '实际完成日期',
  `status` ENUM('pending', 'completed', 'overdue') NOT NULL DEFAULT 'pending' COMMENT '状态',
  `assignee` VARCHAR(100) DEFAULT NULL COMMENT '负责人',
  `notes` TEXT COMMENT '备注',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`experiment_id`) REFERENCES `experiments`(`id`) ON DELETE CASCADE,
  INDEX `idx_experiment_id` (`experiment_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_planned_date` (`planned_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='实验里程碑表';

-- ========================================
-- 种子数据：实验里程碑
-- ========================================
INSERT INTO `experiment_milestones` (`experiment_id`, `name`, `planned_date`, `actual_date`, `status`, `assignee`, `notes`) VALUES
(1, '实验方案设计与审批', '2025-10-15', '2025-10-20', 'completed', '陈博士', 'IACUC审批通过'),
(1, '动物分组与适应期', '2025-11-01', '2025-11-05', 'completed', '李技术员', '小鼠适应环境7天'),
(1, '肿瘤细胞接种', '2025-11-10', '2025-11-12', 'completed', '陈博士', '皮下接种完成'),
(1, '给药开始', '2025-11-20', '2025-11-21', 'completed', '李技术员', '每日一次腹腔注射'),
(1, '中期肿瘤测量', '2025-12-20', NULL, 'pending', '陈博士', '每3天测量一次肿瘤体积'),
(1, '末期解剖与样本采集', '2026-02-15', NULL, 'pending', '王实验员', '主要脏器称重与固定'),
(1, '数据统计与报告撰写', '2026-02-25', NULL, 'pending', '陈博士', '撰写最终研究报告'),
(2, '预实验与剂量确定', '2025-10-01', '2025-10-10', 'completed', '刘研究员', '确定高/中/低三个剂量组'),
(2, '正式实验动物购入', '2025-10-15', '2025-10-16', 'completed', '张采购', 'SPF级SD大鼠40只'),
(2, '28天重复给药', '2025-11-01', NULL, 'pending', '李技术员', '每天同一时间灌胃给药'),
(2, '血液生化检测', '2026-01-20', NULL, 'pending', '王检测员', '检测肝肾功能等20项指标'),
(2, '组织病理学检查', '2026-02-01', NULL, 'pending', '赵病理师', '主要脏器HE染色'),
(2, '总结报告', '2026-02-15', NULL, 'pending', '刘研究员', 'GLP规范总结报告'),
(3, '文献调研与方案设计', '2025-11-01', '2025-11-20', 'completed', '赵教授', '确定Aβ注射造模方案'),
(3, '手术造模', '2025-12-01', '2025-12-05', 'completed', '钱博士', '双侧海马注射Aβ1-42'),
(3, '行为学测试-水迷宫', '2026-02-01', NULL, 'pending', '钱博士', 'Morris水迷宫测试学习记忆'),
(3, '行为学测试-旷场', '2026-03-01', NULL, 'pending', '孙实验员', '旷场实验检测自发活动'),
(3, '脑组织取材', '2026-05-01', NULL, 'pending', '钱博士', '灌注固定取脑'),
(3, '免疫组化分析', '2026-05-20', NULL, 'pending', '李技术员', '检测Aβ斑块与tau磷酸化'),
(3, '论文撰写', '2026-06-01', NULL, 'pending', '赵教授', '目标投稿Neurobiology of Aging'),
(4, '疫苗配方优化', '2026-01-15', NULL, 'pending', '吴副教授', '纳米佐剂配方筛选'),
(4, '动物免疫方案制定', '2026-02-15', NULL, 'pending', '吴副教授', '确定免疫程序和剂量'),
(4, '免疫接种', '2026-03-01', NULL, 'pending', '郑实验员', '皮下免疫3次'),
(4, '抗体滴度检测', '2026-04-15', NULL, 'pending', '王检测员', 'ELISA检测特异性抗体'),
(4, '细胞免疫检测', '2026-05-15', NULL, 'pending', '李研究员', 'ELISpot检测IFN-γ分泌'),
(4, '数据整理与报告', '2026-07-01', NULL, 'pending', '吴副教授', '最终研究报告'),
(5, '模型建立与验证', '2025-09-01', '2025-09-20', 'completed', '孙研究员', 'DNFB诱导接触性皮炎'),
(5, '药物疗效评价', '2025-10-01', '2025-11-15', 'completed', '孙研究员', '评分标准：耳肿胀度'),
(5, '组织病理学检查', '2025-11-20', '2025-12-01', 'completed', '赵病理师', '皮肤组织HE染色'),
(5, '细胞因子检测', '2025-12-10', '2025-12-20', 'completed', '李检测员', 'ELISA检测IL-4、IFN-γ'),
(5, '数据统计分析', '2025-12-25', '2025-12-28', 'completed', '统计师小王', 'GraphPad Prism分析'),
(5, '研究报告撰写', '2025-12-30', '2025-12-30', 'completed', '孙研究员', '项目结题报告');

-- ========================================
-- 饲养记录表
-- ========================================
CREATE TABLE IF NOT EXISTS `feeding_records` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `animal_id` INT NOT NULL COMMENT '动物ID',
  `feed_date` DATE NOT NULL COMMENT '喂养日期',
  `feed_time` TIME DEFAULT NULL COMMENT '喂养时间',
  `food_type` VARCHAR(100) NOT NULL COMMENT '饲料类型',
  `quantity` DECIMAL(10, 2) DEFAULT NULL COMMENT '数量',
  `unit` VARCHAR(20) DEFAULT 'g' COMMENT '单位',
  `water_ml` DECIMAL(10, 2) DEFAULT NULL COMMENT '饮水量(ml)',
  `feeder` VARCHAR(100) DEFAULT NULL COMMENT '喂养员',
  `notes` TEXT COMMENT '备注',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`animal_id`) REFERENCES `animals`(`id`) ON DELETE CASCADE,
  INDEX `idx_animal_id` (`animal_id`),
  INDEX `idx_feed_date` (`feed_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='饲养记录表';

-- ========================================
-- 种子数据：动物信息
-- ========================================
INSERT INTO `animals` (`name`, `species`, `breed`, `gender`, `birth_date`, `weight`, `status`, `cage_number`, `rfid_tag`, `source`, `description`) VALUES
('M-001', '小鼠', 'C57BL/6', 'male', '2025-06-15', 25.30, 'healthy', 'A-101', 'RFID-2025-0001', '北京维通利华实验动物中心', '健康雄性C57BL/6小鼠，用于免疫学研究'),
('M-002', '小鼠', 'C57BL/6', 'female', '2025-06-15', 21.50, 'healthy', 'A-101', 'RFID-2025-0002', '北京维通利华实验动物中心', '健康雌性C57BL/6小鼠'),
('M-003', '小鼠', 'BALB/c', 'male', '2025-07-01', 23.80, 'in_experiment', 'A-102', 'RFID-2025-0003', '上海斯莱克实验动物中心', '正在参与药效评价实验'),
('M-004', '小鼠', 'BALB/c', 'female', '2025-07-01', 20.10, 'in_experiment', 'A-102', 'RFID-2025-0004', '上海斯莱克实验动物中心', '正在参与药效评价实验'),
('M-005', '小鼠', 'ICR', 'male', '2025-08-10', 28.60, 'healthy', 'A-103', 'RFID-2025-0005', '广东省医学实验动物中心', '常规饲养ICR小鼠'),
('R-001', '大鼠', 'SD', 'male', '2025-05-20', 320.50, 'healthy', 'B-201', 'RFID-2025-0006', '北京维通利华实验动物中心', '健康SD大鼠，用于毒理学研究'),
('R-002', '大鼠', 'SD', 'female', '2025-05-20', 280.30, 'sick', 'B-201', 'RFID-2025-0007', '北京维通利华实验动物中心', '近期出现食欲下降，需观察'),
('R-003', '大鼠', 'Wistar', 'male', '2025-06-01', 350.00, 'in_experiment', 'B-202', 'RFID-2025-0008', '上海斯莱克实验动物中心', '参与神经行为学实验'),
('RB-001', '兔', '新西兰白兔', 'female', '2025-03-15', 2800.00, 'healthy', 'C-301', 'RFID-2025-0009', '山东鲁抗实验动物中心', '用于抗体生产'),
('RB-002', '兔', '新西兰白兔', 'male', '2025-04-01', 3200.00, 'quarantine', 'C-302', 'RFID-2025-0010', '山东鲁抗实验动物中心', '新到检疫中'),
('GP-001', '豚鼠', 'Hartley', 'male', '2025-07-20', 450.00, 'healthy', 'D-401', 'RFID-2025-0011', '广东省医学实验动物中心', '用于过敏性测试'),
('GP-002', '豚鼠', 'Hartley', 'female', '2025-07-20', 380.00, 'healthy', 'D-401', 'RFID-2025-0012', '广东省医学实验动物中心', '用于过敏性测试');

-- ========================================
-- 种子数据：健康记录
-- ========================================
INSERT INTO `health_records` (`animal_id`, `check_date`, `temperature`, `weight`, `heart_rate`, `respiratory_rate`, `condition`, `diagnosis`, `treatment`, `veterinarian`, `next_check_date`, `notes`) VALUES
(1, '2025-12-01', 37.2, 25.30, 600, 160, 'normal', '各项指标正常', '无需治疗', '张医生', '2026-01-01', '定期体检'),
(2, '2025-12-01', 37.1, 21.50, 620, 155, 'normal', '各项指标正常', '无需治疗', '张医生', '2026-01-01', '定期体检'),
(3, '2025-12-05', 37.5, 24.10, 580, 170, 'normal', '实验前体检，指标正常', '无需治疗', '李医生', '2025-12-15', '实验期间每10天复查'),
(6, '2025-12-02', 37.8, 325.00, 350, 90, 'normal', '各项指标正常', '无需治疗', '王医生', '2026-01-02', 'SD大鼠定期体检'),
(7, '2025-12-10', 38.5, 270.00, 380, 100, 'abnormal', '食欲下降，体重减轻', '口服补液盐，加强营养', '王医生', '2025-12-13', '需密切观察'),
(8, '2025-12-08', 37.6, 352.00, 340, 85, 'normal', '实验进行中，指标稳定', '按实验方案用药', '李医生', '2025-12-18', '行为学测试前体检'),
(9, '2025-12-03', 38.9, 2810.00, 220, 50, 'normal', '各项指标正常', '无需治疗', '赵医生', '2026-01-03', '兔子定期体检'),
(10, '2025-12-15', 39.2, 3150.00, 240, 55, 'normal', '检疫期体检正常', '继续观察', '赵医生', '2025-12-22', '检疫期第二次体检'),
(11, '2025-12-05', 38.6, 455.00, 280, 80, 'normal', '各项指标正常', '无需治疗', '张医生', '2026-01-05', '豚鼠定期体检'),
(1, '2026-01-01', 37.3, 26.00, 590, 158, 'normal', '体重增长正常', '无需治疗', '张医生', '2026-02-01', '月度例行体检');

-- ========================================
-- 种子数据：实验项目
-- ========================================
INSERT INTO `experiments` (`name`, `project_code`, `description`, `start_date`, `end_date`, `status`, `researcher`, `department`, `notes`) VALUES
('新型抗肿瘤药物XR-7的药效评价', 'EXP-2025-001', '评估新型抗肿瘤药物XR-7对BALB/c小鼠移植瘤的抑制效果，包括肿瘤体积变化、生存期及毒性观察', '2025-11-01', '2026-03-01', 'in_progress', '陈博士', '药理学研究室', 'IACUC审批编号：2025-A-042'),
('SD大鼠慢性毒性试验', 'EXP-2025-002', '通过28天重复给药毒性试验评估候选药物的安全性，观察大鼠的一般状态、血液生化和组织病理学变化', '2025-10-15', '2026-02-15', 'in_progress', '刘研究员', '毒理学研究室', 'GLP规范执行'),
('神经退行性疾病模型建立', 'EXP-2025-003', '利用Wistar大鼠建立阿尔茨海默病动物模型，通过行为学测试和脑组织分析验证模型的有效性', '2025-12-01', '2026-06-01', 'in_progress', '赵教授', '神经科学研究室', '与附属医院合作项目'),
('新型疫苗佐剂免疫原性研究', 'EXP-2025-004', '评估新型纳米佐剂对小鼠免疫应答的增强效果，检测抗体滴度和细胞免疫指标', '2026-01-15', '2026-07-15', 'planning', '吴副教授', '免疫学研究室', '已获伦理审批，待启动'),
('过敏性接触性皮炎模型研究', 'EXP-2025-005', '利用豚鼠建立过敏性接触性皮炎模型，评估新型抗过敏药物的疗效', '2025-09-01', '2025-12-30', 'completed', '孙研究员', '皮肤病学研究室', '实验已完成，报告撰写中');

-- ========================================
-- 种子数据：实验-动物关联
-- ========================================
INSERT INTO `experiment_animals` (`experiment_id`, `animal_id`, `role`, `join_date`, `leave_date`, `notes`) VALUES
(1, 3, 'treatment_group', '2025-11-01', NULL, '治疗组 - 高剂量'),
(1, 4, 'control_group', '2025-11-01', NULL, '对照组 - 溶媒对照'),
(2, 6, 'treatment_group', '2025-10-15', NULL, '治疗组 - 中剂量'),
(3, 8, 'treatment_group', '2025-12-01', NULL, '模型组'),
(5, 11, 'treatment_group', '2025-09-01', '2025-12-30', '治疗组'),
(5, 12, 'control_group', '2025-09-01', '2025-12-30', '对照组');

-- ========================================
-- 动物转移/借调记录表
-- ========================================
CREATE TABLE IF NOT EXISTS `animal_transfers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `animal_id` INT NOT NULL COMMENT '动物ID',
  `from_department` VARCHAR(100) NOT NULL COMMENT '转出方（部门/实验室名称）',
  `to_department` VARCHAR(100) NOT NULL COMMENT '接收方（部门/实验室名称）',
  `reason` ENUM('experiment_borrow', 'permanent_transfer', 'return_to_supplier') NOT NULL COMMENT '转移原因',
  `transfer_date` DATE NOT NULL COMMENT '转移日期',
  `expected_return_date` DATE DEFAULT NULL COMMENT '预计归还日期（借调时使用）',
  `actual_return_date` DATE DEFAULT NULL COMMENT '实际归还日期',
  `status` ENUM('pending', 'in_transit', 'completed', 'returned') NOT NULL DEFAULT 'pending' COMMENT '状态',
  `handler` VARCHAR(100) NOT NULL COMMENT '经办人',
  `approver` VARCHAR(100) DEFAULT NULL COMMENT '审批人',
  `remarks` TEXT COMMENT '备注',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`animal_id`) REFERENCES `animals`(`id`) ON DELETE CASCADE,
  INDEX `idx_animal_id` (`animal_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_transfer_date` (`transfer_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='动物转移/借调记录表';

-- ========================================
-- 死亡记录表
-- ========================================
CREATE TABLE IF NOT EXISTS `death_records` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `animal_id` INT NOT NULL COMMENT '动物ID',
  `death_datetime` DATETIME NOT NULL COMMENT '死亡日期时间',
  `cause_category` ENUM('natural', 'experiment_termination', 'accidental', 'euthanasia') NOT NULL COMMENT '死亡原因分类',
  `cause_description` TEXT COMMENT '详细死亡原因描述',
  `found_by` VARCHAR(100) DEFAULT NULL COMMENT '发现人',
  `confirming_vet` VARCHAR(100) DEFAULT NULL COMMENT '确认兽医',
  `disposal_method` ENUM('necropsy', 'incineration', 'cryopreservation') NOT NULL COMMENT '处置方式',
  `necropsy_status` ENUM('not_needed', 'pending', 'completed') NOT NULL DEFAULT 'not_needed' COMMENT '尸检状态',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`animal_id`) REFERENCES `animals`(`id`) ON DELETE CASCADE,
  INDEX `idx_animal_id` (`animal_id`),
  INDEX `idx_death_datetime` (`death_datetime`),
  INDEX `idx_cause_category` (`cause_category`),
  INDEX `idx_necropsy_status` (`necropsy_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='死亡记录表';

-- ========================================
-- 尸检报告表
-- ========================================
CREATE TABLE IF NOT EXISTS `necropsy_reports` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `death_record_id` INT NOT NULL COMMENT '死亡记录ID',
  `necropsy_date` DATE NOT NULL COMMENT '尸检日期',
  `performed_by` VARCHAR(100) DEFAULT NULL COMMENT '执行人',
  `gross_findings` TEXT COMMENT '大体观察结果',
  `histopathology_findings` TEXT COMMENT '组织病理学发现',
  `final_diagnosis` TEXT COMMENT '最终诊断',
  `image_urls` JSON COMMENT '关联图片列表',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`death_record_id`) REFERENCES `death_records`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_death_record_id` (`death_record_id`),
  INDEX `idx_necropsy_date` (`necropsy_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='尸检报告表';

-- ========================================
-- 种子数据：饲养记录
-- ========================================
INSERT INTO `feeding_records` (`animal_id`, `feed_date`, `feed_time`, `food_type`, `quantity`, `unit`, `water_ml`, `feeder`, `notes`) VALUES
(1, '2026-01-20', '08:00:00', '标准啮齿类动物饲料', 5.00, 'g', 8.00, '小李', '正常进食'),
(1, '2026-01-20', '17:00:00', '标准啮齿类动物饲料', 5.00, 'g', 7.50, '小王', '正常进食'),
(2, '2026-01-20', '08:00:00', '标准啮齿类动物饲料', 4.50, 'g', 7.00, '小李', '正常进食'),
(3, '2026-01-20', '08:00:00', '实验专用饲料-高脂', 6.00, 'g', 8.50, '小李', '实验期间特殊饮食'),
(6, '2026-01-20', '08:00:00', '标准大鼠饲料', 25.00, 'g', 35.00, '小张', '正常进食'),
(6, '2026-01-20', '17:00:00', '标准大鼠饲料', 20.00, 'g', 30.00, '小陈', '正常进食'),
(7, '2026-01-20', '08:00:00', '标准大鼠饲料', 18.00, 'g', 25.00, '小张', '进食量略少于正常'),
(8, '2026-01-20', '08:00:00', '实验专用饲料', 22.00, 'g', 32.00, '小张', '实验期间按方案喂养'),
(9, '2026-01-20', '08:00:00', '兔用颗粒饲料', 150.00, 'g', 300.00, '小刘', '正常进食，补充了苜蓿草'),
(10, '2026-01-20', '08:00:00', '兔用颗粒饲料', 130.00, 'g', 280.00, '小刘', '检疫期饲料'),
(11, '2026-01-20', '08:00:00', '豚鼠专用饲料', 35.00, 'g', 50.00, '小李', '补充维C蔬菜'),
(12, '2026-01-20', '08:00:00', '豚鼠专用饲料', 30.00, 'g', 45.00, '小李', '补充维C蔬菜'),
(1, '2026-01-21', '08:00:00', '标准啮齿类动物饲料', 5.00, 'g', 8.00, '小李', '正常进食'),
(2, '2026-01-21', '08:00:00', '标准啮齿类动物饲料', 4.80, 'g', 7.20, '小李', '正常进食'),
(6, '2026-01-21', '08:00:00', '标准大鼠饲料', 24.00, 'g', 33.00, '小张', '正常进食');

-- ========================================
-- 种子数据：动物转移/借调记录
-- ========================================
INSERT INTO `animal_transfers` (`animal_id`, `from_department`, `to_department`, `reason`, `transfer_date`, `expected_return_date`, `actual_return_date`, `status`, `handler`, `approver`, `remarks`) VALUES
(1, '动物饲养中心', '药理学研究室', 'experiment_borrow', '2026-01-15', '2026-02-15', NULL, 'in_transit', '小李', '王主任', '用于急性毒性预实验'),
(2, '动物饲养中心', '药理学研究室', 'experiment_borrow', '2026-01-15', '2026-02-15', NULL, 'in_transit', '小李', '王主任', '用于急性毒性预实验'),
(5, '动物饲养中心', '免疫学研究室', 'permanent_transfer', '2026-01-10', NULL, NULL, 'completed', '小张', '李主任', '永久调拨至免疫室用于抗体生产'),
(9, '抗体研究组', '动物饲养中心', 'experiment_borrow', '2026-01-05', '2026-01-20', '2026-01-18', 'returned', '小刘', '赵主任', '抗体滴度检测完成后归还'),
(10, '山东鲁抗实验动物中心', '动物饲养中心', 'permanent_transfer', '2026-01-12', NULL, NULL, 'completed', '小王', '王主任', '新购入新西兰白兔，检疫后入饲养中心'),
(3, '药理学研究室', '动物饲养中心', 'return_to_supplier', '2026-02-01', NULL, NULL, 'pending', '小陈', '李主任', '实验结束后退还给供应商'),
(7, '毒理学研究室', '动物饲养中心', 'experiment_borrow', '2026-01-20', '2026-02-20', NULL, 'pending', '小张', '王主任', '恢复观察期后归还饲养中心');

-- ========================================
-- 种子数据：死亡记录
-- ========================================
INSERT INTO `death_records` (`animal_id`, `death_datetime`, `cause_category`, `cause_description`, `found_by`, `confirming_vet`, `disposal_method`, `necropsy_status`) VALUES
(4, '2026-01-15 14:30:00', 'experiment_termination', '实验结束后安乐死，符合动物伦理规范', '小陈', '李医生', 'necropsy', 'completed'),
(12, '2026-01-18 09:15:00', 'natural', '老年自然死亡，无明显外伤或疾病症状', '小李', '张医生', 'incineration', 'not_needed');

-- ========================================
-- 种子数据：尸检报告
-- ========================================
INSERT INTO `necropsy_reports` (`death_record_id`, `necropsy_date`, `performed_by`, `gross_findings`, `histopathology_findings`, `final_diagnosis`, `image_urls`) VALUES
(1, '2026-01-16', '李医生', '大体观察：体重约20g，体型消瘦，被毛凌乱。腹腔内各脏器位置正常，肝脏颜色略浅，脾脏体积缩小。心脏大小正常，肺脏表面光滑无出血点。胃肠道空虚。', '组织病理学检查：肝细胞轻度脂肪变性，脾淋巴细胞数量减少，符合实验药物引起的免疫抑制表现。肾小管上皮细胞轻度水肿。', '实验药物引起的免疫抑制导致的多器官功能轻度损伤，结合实验方案判定为实验终点安乐死。', NULL);

-- 更新已死亡动物状态
UPDATE `animals` SET `status` = 'deceased' WHERE `id` IN (4, 12);

-- ========================================
-- 库存物品表
-- ========================================
CREATE TABLE IF NOT EXISTS `inventory_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(200) NOT NULL COMMENT '物品名称',
  `category` ENUM('drug', 'consumable', 'reagent', 'equipment') NOT NULL COMMENT '类别',
  `specification` VARCHAR(200) DEFAULT NULL COMMENT '规格',
  `unit` VARCHAR(20) NOT NULL COMMENT '单位',
  `current_quantity` DECIMAL(12, 2) NOT NULL DEFAULT 0 COMMENT '当前库存数量',
  `safety_stock` DECIMAL(12, 2) NOT NULL DEFAULT 0 COMMENT '安全库存量',
  `storage_location` VARCHAR(200) DEFAULT NULL COMMENT '存储位置',
  `expiry_date` DATE DEFAULT NULL COMMENT '有效期截止日期',
  `supplier` VARCHAR(200) DEFAULT NULL COMMENT '供应商',
  `unit_price` DECIMAL(10, 2) DEFAULT NULL COMMENT '单价',
  `remark` TEXT COMMENT '备注',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_category` (`category`),
  INDEX `idx_name` (`name`),
  INDEX `idx_expiry_date` (`expiry_date`),
  INDEX `idx_supplier` (`supplier`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='库存物品表';

-- ========================================
-- 库存事务表（出入库流水）
-- ========================================
CREATE TABLE IF NOT EXISTS `inventory_transactions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `item_id` INT NOT NULL COMMENT '物品ID',
  `type` ENUM('in', 'out', 'adjust') NOT NULL COMMENT '事务类型',
  `quantity` DECIMAL(12, 2) NOT NULL COMMENT '数量（正负）',
  `transaction_date` DATETIME NOT NULL COMMENT '事务日期',
  `operator` VARCHAR(100) DEFAULT NULL COMMENT '操作人',
  `experiment_id` INT DEFAULT NULL COMMENT '关联实验ID',
  `reason` TEXT COMMENT '原因说明',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`item_id`) REFERENCES `inventory_items`(`id`) ON DELETE CASCADE,
  INDEX `idx_item_id` (`item_id`),
  INDEX `idx_type` (`type`),
  INDEX `idx_transaction_date` (`transaction_date`),
  INDEX `idx_experiment_id` (`experiment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='库存事务表';

-- ========================================
-- 种子数据：库存物品
-- ========================================
INSERT INTO `inventory_items` (`name`, `category`, `specification`, `unit`, `current_quantity`, `safety_stock`, `storage_location`, `expiry_date`, `supplier`, `unit_price`, `remark`) VALUES
('青霉素钠', 'drug', '100万单位/瓶', '瓶', 45, 20, 'A区-药品柜-1层', '2027-06-30', '国药集团', 25.50, '常规抗生素'),
('阿莫西林', 'drug', '500mg/片', '盒', 8, 10, 'A区-药品柜-1层', '2026-07-15', '华北制药', 45.00, '库存偏低，需补货'),
('乙醚', 'drug', '500ml/瓶', '瓶', 12, 5, 'B区-危险品柜', '2028-01-01', '上海化学试剂', 85.00, '麻醉用，需双人双锁管理'),
('一次性手套', 'consumable', 'M号/100只/盒', '盒', 30, 10, 'C区-耗材架-1层', NULL, '英科医疗', 35.00, '丁腈手套'),
('离心管', 'consumable', '1.5ml/500支/包', '包', 15, 5, 'C区-耗材架-2层', NULL, '爱思进', 120.00, '无菌无酶'),
('培养皿', 'consumable', '90mm/20个/包', '包', 8, 5, 'C区-耗材架-3层', NULL, '康宁', 95.00, '塑料培养皿'),
('PBS缓冲液', 'reagent', '500ml/瓶', '瓶', 25, 8, 'D区-试剂柜-常温', '2026-08-20', '赛默飞世尔', 65.00, 'pH7.4'),
('DMEM培养基', 'reagent', '500ml/瓶', '瓶', 6, 10, 'D区-试剂柜-4℃', '2026-06-25', 'Gibco', 180.00, '含10%FBS，即将过期'),
('胎牛血清', 'reagent', '100ml/瓶', '瓶', 3, 5, 'E区-冰箱-20℃', '2026-12-31', 'Gibco', 980.00, '特级胎牛血清'),
('移液器', 'equipment', '10-100μl', '支', 8, 2, 'F区-仪器柜', NULL, 'Eppendorf', 2500.00, '单道可调移液器'),
('分析天平', 'equipment', '0.1mg/220g', '台', 2, 1, 'G区-天平室', NULL, '梅特勒', 15000.00, '万分之一分析天平'),
('高压灭菌锅', 'equipment', '50L', '台', 1, 1, 'H区-消毒室', NULL, '日本三洋', 35000.00, '全自动高压灭菌器'),
('75%酒精', 'consumable', '500ml/瓶', '瓶', 40, 15, 'C区-耗材架-4层', '2027-03-15', '国药集团', 15.00, '消毒用酒精'),
('EDTA', 'reagent', '500g/瓶', '瓶', 2, 3, 'D区-试剂柜-常温', '2029-01-01', 'Sigma', 280.00, '螯合剂'),
('显微镜', 'equipment', '正置荧光显微镜', '台', 1, 0, 'I区-细胞室', NULL, '奥林巴斯', 120000.00, '研究级显微镜'),
('生理盐水', 'drug', '500ml/瓶', '瓶', 5, 10, 'A区-药品柜-2层', '2026-06-10', '四川科伦', 8.50, '库存不足且即将过期');

-- ========================================
-- 种子数据：库存事务流水
-- ========================================
INSERT INTO `inventory_transactions` (`item_id`, `type`, `quantity`, `transaction_date`, `operator`, `experiment_id`, `reason`) VALUES
(1, 'in', 50, '2026-01-10 09:00:00', '库管员小王', NULL, '新采购入库'),
(1, 'out', -5, '2026-02-15 14:30:00', '李研究员', 1, '实验项目使用'),
(2, 'in', 20, '2026-01-05 10:00:00', '库管员小王', NULL, '期初库存'),
(2, 'out', -12, '2026-03-20 11:00:00', '张医生', NULL, '日常治疗使用'),
(3, 'in', 10, '2026-01-08 09:30:00', '库管员小王', NULL, '采购入库'),
(3, 'out', 2, '2026-04-10 15:00:00', '赵教授', 3, '实验麻醉用'),
(4, 'in', 50, '2026-01-01 08:00:00', '库管员小王', NULL, '期初库存'),
(4, 'out', -20, '2026-02-28 10:00:00', '实验室全员', NULL, '日常消耗'),
(5, 'in', 20, '2026-01-15 09:00:00', '库管员小王', NULL, '采购入库'),
(5, 'out', -5, '2026-03-05 14:00:00', '陈博士', 1, '分子生物学实验'),
(6, 'in', 15, '2026-01-20 10:00:00', '库管员小王', NULL, '采购入库'),
(6, 'out', -7, '2026-04-01 09:30:00', '吴副教授', 4, '细胞培养实验'),
(7, 'in', 30, '2026-01-10 08:30:00', '库管员小王', NULL, '采购入库'),
(7, 'out', -5, '2026-03-10 11:00:00', '李研究员', NULL, '缓冲液配制'),
(8, 'in', 10, '2026-01-12 10:00:00', '库管员小王', NULL, '采购入库'),
(8, 'out', -4, '2026-04-05 09:00:00', '陈博士', 1, '细胞换液'),
(9, 'in', 5, '2026-01-08 09:00:00', '库管员小王', NULL, '采购入库'),
(9, 'out', -2, '2026-02-15 10:30:00', '吴副教授', 4, '细胞培养'),
(10, 'in', 10, '2026-01-05 09:00:00', '库管员小王', NULL, '设备验收入库'),
(11, 'in', 2, '2025-12-20 10:00:00', '库管员小王', NULL, '设备采购入库'),
(12, 'in', 1, '2025-11-10 09:00:00', '库管员小王', NULL, '设备采购入库'),
(13, 'in', 50, '2026-01-01 08:00:00', '库管员小王', NULL, '期初库存'),
(13, 'out', -10, '2026-03-15 14:00:00', '实验室全员', NULL, '日常消毒消耗'),
(14, 'in', 5, '2026-01-18 10:00:00', '库管员小王', NULL, '采购入库'),
(14, 'out', -3, '2026-04-02 09:30:00', '李研究员', NULL, '缓冲液配制'),
(15, 'in', 1, '2025-10-15 09:00:00', '库管员小王', NULL, '大型设备入库'),
(16, 'in', 15, '2026-01-02 08:00:00', '库管员小王', NULL, '期初库存'),
(16, 'out', -10, '2026-03-20 11:00:00', '张医生', NULL, '日常使用');

-- ========================================
-- 称重记录表
-- ========================================
CREATE TABLE IF NOT EXISTS `weight_records` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `animal_id` INT NOT NULL COMMENT '动物ID',
  `weigh_date` DATE NOT NULL COMMENT '称重日期',
  `weigh_time` TIME DEFAULT NULL COMMENT '称重时间',
  `weight` DECIMAL(10, 2) NOT NULL COMMENT '体重(g)',
  `weigher` VARCHAR(100) DEFAULT NULL COMMENT '称重者',
  `device_no` VARCHAR(100) DEFAULT NULL COMMENT '设备编号',
  `notes` TEXT COMMENT '备注',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`animal_id`) REFERENCES `animals`(`id`) ON DELETE CASCADE,
  INDEX `idx_animal_id` (`animal_id`),
  INDEX `idx_weigh_date` (`weigh_date`),
  INDEX `idx_weigher` (`weigher`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='称重记录表';

-- ========================================
-- 种子数据：称重记录
-- ========================================
INSERT INTO `weight_records` (`animal_id`, `weigh_date`, `weigh_time`, `weight`, `weigher`, `device_no`, `notes`) VALUES
(1, '2026-01-05', '09:00:00', 25.20, '小李', 'BAL-001', '周一周重'),
(1, '2026-01-10', '09:05:00', 25.50, '小李', 'BAL-001', '周中称重'),
(1, '2026-01-15', '09:10:00', 25.80, '小王', 'BAL-001', '周五称重'),
(1, '2026-01-20', '09:00:00', 26.10, '小李', 'BAL-001', '周一周重'),
(1, '2026-01-25', '09:05:00', 26.30, '小李', 'BAL-001', '周中称重'),
(2, '2026-01-05', '09:15:00', 21.30, '小李', 'BAL-001', '周一周重'),
(2, '2026-01-10', '09:20:00', 21.60, '小李', 'BAL-001', '周中称重'),
(2, '2026-01-15', '09:25:00', 21.40, '小王', 'BAL-001', '周五称重，略轻'),
(2, '2026-01-20', '09:30:00', 21.80, '小李', 'BAL-001', '周一周重'),
(3, '2026-01-05', '09:35:00', 23.50, '小陈', 'BAL-001', '实验开始称重'),
(3, '2026-01-10', '09:40:00', 24.00, '小陈', 'BAL-001', '给药5天后'),
(3, '2026-01-15', '09:45:00', 23.20, '小陈', 'BAL-001', '给药10天后，体重下降'),
(3, '2026-01-20', '09:50:00', 22.80, '小陈', 'BAL-001', '给药15天'),
(5, '2026-01-05', '10:00:00', 28.40, '小李', 'BAL-001', '常规称重'),
(5, '2026-01-10', '10:05:00', 28.90, '小李', 'BAL-001', '常规称重'),
(5, '2026-01-15', '10:10:00', 29.10, '小王', 'BAL-001', '常规称重'),
(5, '2026-01-20', '10:15:00', 29.50, '小李', 'BAL-001', '常规称重'),
(6, '2026-01-05', '10:20:00', 322.00, '小张', 'SD-001', '大鼠周重'),
(6, '2026-01-10', '10:25:00', 328.50, '小张', 'SD-001', '周中称重'),
(6, '2026-01-15', '10:30:00', 332.00, '小张', 'SD-001', '周五称重'),
(6, '2026-01-20', '10:35:00', 335.50, '小张', 'SD-001', '周一周重'),
(7, '2026-01-05', '10:40:00', 282.00, '小张', 'SD-001', '病后称重'),
(7, '2026-01-10', '10:45:00', 278.50, '小张', 'SD-001', '食欲下降'),
(7, '2026-01-15', '10:50:00', 275.00, '小王', 'SD-001', '持续减轻，需关注'),
(7, '2026-01-20', '10:55:00', 272.00, '小张', 'SD-001', '治疗中'),
(8, '2026-01-05', '11:00:00', 348.00, '小张', 'SD-001', '实验开始'),
(8, '2026-01-10', '11:05:00', 351.00, '小张', 'SD-001', '手术恢复期'),
(8, '2026-01-15', '11:10:00', 355.00, '小王', 'SD-001', '恢复良好'),
(8, '2026-01-20', '11:15:00', 358.50, '小张', 'SD-001', '状态稳定'),
(9, '2026-01-05', '14:00:00', 2790.00, '小刘', 'RB-001', '兔子周重'),
(9, '2026-01-15', '14:05:00', 2820.00, '小刘', 'RB-001', '两周称重'),
(9, '2026-01-25', '14:10:00', 2850.00, '小王', 'RB-001', '月中称重'),
(11, '2026-01-05', '14:20:00', 452.00, '小李', 'GP-001', '豚鼠周重'),
(11, '2026-01-15', '14:25:00', 458.00, '小李', 'GP-001', '两周称重'),
(11, '2026-01-25', '14:30:00', 462.00, '小王', 'GP-001', '月中称重'),
(12, '2026-01-05', '14:35:00', 378.00, '小李', 'GP-001', '豚鼠周重'),
(12, '2026-01-10', '14:40:00', 380.00, '小李', 'GP-001', '死亡前最后一次称重');

-- ========================================
-- 种子数据：更多用户
-- ========================================
INSERT IGNORE INTO `users` (`username`, `password`, `name`, `role`) VALUES
('zhangsan', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '张三', 'user'),
('lisi', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '李四', 'user'),
('wangwu', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '王五', 'user');

-- ========================================
-- 公告表
-- ========================================
CREATE TABLE IF NOT EXISTS `announcements` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(200) NOT NULL COMMENT '公告标题',
  `content` TEXT NOT NULL COMMENT '公告内容（富文本）',
  `type` ENUM('notice', 'warning', 'update') NOT NULL DEFAULT 'notice' COMMENT '公告类型',
  `publisher_id` INT NOT NULL COMMENT '发布人ID',
  `publish_time` TIMESTAMP NULL DEFAULT NULL COMMENT '发布时间',
  `is_pinned` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否置顶',
  `status` ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft' COMMENT '状态',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`publisher_id`) REFERENCES `users`(`id`),
  INDEX `idx_type` (`type`),
  INDEX `idx_status` (`status`),
  INDEX `idx_publish_time` (`publish_time`),
  INDEX `idx_is_pinned` (`is_pinned`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='公告表';

-- ========================================
-- 种子数据：公告
-- ========================================
INSERT INTO `announcements` (`title`, `content`, `type`, `publisher_id`, `publish_time`, `is_pinned`, `status`) VALUES
('系统维护通知', '<p>各位用户您好：</p><p>系统将于<strong>2026年2月15日 22:00-24:00</strong>进行例行维护升级，期间系统将暂停服务。</p><p>给您带来的不便，敬请谅解！</p>', 'notice', 1, '2026-01-20 10:00:00', 1, 'published'),
('新型冠状病毒疫苗研究进展', '<p>我室新型疫苗佐剂免疫原性研究项目取得重要进展，抗体滴度较对照组提升3倍。</p><p>详细数据请查看实验项目 EXP-2025-004。</p>', 'update', 1, '2026-01-18 14:30:00', 0, 'published'),
('动物饲养安全警示', '<p>近日发现个别笼位出现饲料霉变情况，请各饲养员加强日常巡检，发现问题及时上报。</p><p style=\"color:red;\"><strong>注意：</strong>霉变饲料严禁继续饲喂！</p>', 'warning', 1, '2026-01-15 09:00:00', 0, 'published'),
('新功能上线：消息通知系统', '<p>系统新增站内信功能，您可以：</p><ul><li>接收系统通知</li><li>与其他用户互发消息</li><li>关联动物或实验资源</li></ul><p>欢迎体验新功能！</p>', 'update', 1, '2026-01-10 16:00:00', 0, 'published');

-- ========================================
-- 站内信表
-- ========================================
CREATE TABLE IF NOT EXISTS `messages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sender_id` INT NOT NULL COMMENT '发送人ID',
  `receiver_id` INT NOT NULL COMMENT '接收人ID',
  `title` VARCHAR(200) NOT NULL COMMENT '消息标题',
  `content` TEXT NOT NULL COMMENT '消息内容',
  `is_read` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否已读',
  `send_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '发送时间',
  `related_type` VARCHAR(50) DEFAULT NULL COMMENT '关联资源类型',
  `related_id` INT DEFAULT NULL COMMENT '关联资源ID',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`receiver_id`) REFERENCES `users`(`id`),
  INDEX `idx_sender_id` (`sender_id`),
  INDEX `idx_receiver_id` (`receiver_id`),
  INDEX `idx_is_read` (`is_read`),
  INDEX `idx_send_time` (`send_time`),
  INDEX `idx_related` (`related_type`, `related_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='站内信表';

-- ========================================
-- 种子数据：站内信
-- ========================================
INSERT INTO `messages` (`sender_id`, `receiver_id`, `title`, `content`, `is_read`, `send_time`, `related_type`, `related_id`) VALUES
(1, 2, '欢迎使用动物管理系统', '欢迎您加入实验室动物信息管理系统！如有问题请联系管理员。', 1, '2026-01-05 09:00:00', NULL, NULL),
(1, 3, '实验进度提醒', '您好，SD大鼠慢性毒性试验项目已进入关键阶段，请按时完成每日记录。', 0, '2026-01-20 10:30:00', 'experiment', 2),
(2, 1, '关于动物编号M-003的状态更新', '管理员您好，动物M-003状态更新为实验中，请知悉。', 1, '2026-01-18 15:00:00', 'animal', 3),
(3, 2, '称重数据提醒', '张三你好，请及时录入本周的大鼠称重数据，谢谢！', 0, '2026-01-22 08:30:00', NULL, NULL),
(1, 4, '系统新功能通知', '系统已上线消息通知功能，您现在可以通过站内信接收重要通知。', 0, '2026-01-21 11:00:00', NULL, NULL),
(2, 3, '实验动物申请', '李四你好，我需要申请使用2只C57BL/6小鼠进行预实验，请问近期是否有空余？', 0, '2026-01-22 14:00:00', 'experiment', 1);

-- ========================================
-- 动物使用申请表
-- ========================================
CREATE TABLE IF NOT EXISTS `animal_usage_requests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `applicant_id` INT NOT NULL COMMENT '申请人ID',
  `request_date` DATE NOT NULL COMMENT '申请日期',
  `experiment_id` INT DEFAULT NULL COMMENT '实验项目ID（可选）',
  `species` VARCHAR(50) NOT NULL COMMENT '申请动物物种',
  `strain` VARCHAR(50) DEFAULT NULL COMMENT '品系',
  `quantity` INT NOT NULL COMMENT '申请数量',
  `gender_requirement` ENUM('male', 'female', 'any') NOT NULL DEFAULT 'any' COMMENT '性别要求',
  `min_weight` DECIMAL(10, 2) DEFAULT NULL COMMENT '最小体重(g)',
  `max_weight` DECIMAL(10, 2) DEFAULT NULL COMMENT '最大体重(g)',
  `purpose` TEXT NOT NULL COMMENT '使用目的描述',
  `start_date` DATE NOT NULL COMMENT '预计使用开始日期',
  `end_date` DATE NOT NULL COMMENT '预计使用结束日期',
  `status` ENUM('draft', 'submitted', 'approved', 'rejected', 'withdrawn') NOT NULL DEFAULT 'draft' COMMENT '审批状态',
  `approver_id` INT DEFAULT NULL COMMENT '审批人ID',
  `approval_time` DATETIME DEFAULT NULL COMMENT '审批时间',
  `approval_comment` TEXT COMMENT '审批意见',
  `allocation_result` JSON COMMENT '分配结果JSON',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`applicant_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`approver_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`experiment_id`) REFERENCES `experiments`(`id`) ON DELETE SET NULL,
  INDEX `idx_applicant_id` (`applicant_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_request_date` (`request_date`),
  INDEX `idx_species` (`species`),
  INDEX `idx_experiment_id` (`experiment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='动物使用申请表';

-- ========================================
-- 种子数据：动物使用申请
-- ========================================
INSERT INTO `animal_usage_requests` (`applicant_id`, `request_date`, `experiment_id`, `species`, `strain`, `quantity`, `gender_requirement`, `min_weight`, `max_weight`, `purpose`, `start_date`, `end_date`, `status`, `approver_id`, `approval_time`, `approval_comment`, `allocation_result`) VALUES
(2, '2026-01-20', 1, '小鼠', 'C57BL/6', 2, 'male', 20.00, 25.00, '用于急性毒性预实验，需要雄性成年小鼠', '2026-02-01', '2026-02-15', 'submitted', NULL, NULL, NULL, NULL),
(3, '2026-01-18', 2, '大鼠', 'SD', 3, 'any', 250.00, 300.00, '慢性毒性试验，雌雄各半', '2026-01-25', '2026-03-25', 'approved', 1, '2026-01-19 10:30:00', '同意申请，请按实验方案进行', '{"animalIds":[6,7,8],"animals":[{"id":6,"name":"大鼠-001","species":"大鼠","gender":"male","weight":335.5,"cageNumber":"R-01"},{"id":7,"name":"大鼠-002","species":"大鼠","gender":"male","weight":272.0,"cageNumber":"R-02"},{"id":8,"name":"大鼠-003","species":"大鼠","gender":"female","weight":358.5,"cageNumber":"R-03"}]}'),
(2, '2026-01-15', NULL, '家兔', '新西兰白兔', 1, 'female', 2500.00, 3000.00, '抗体制备实验', '2026-02-10', '2026-05-10', 'draft', NULL, NULL, NULL, NULL),
(3, '2026-01-21', 4, '豚鼠', 'Hartley', 4, 'any', 400.00, 500.00, '过敏性试验', '2026-02-05', '2026-02-20', 'rejected', 1, '2026-01-22 09:00:00', '目前豚鼠库存不足，建议延后申请或改用小鼠模型', NULL);

-- ========================================
-- 动物图片表
-- ========================================
CREATE TABLE IF NOT EXISTS `animal_photos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `animal_id` INT NOT NULL COMMENT '动物ID',
  `image_url` VARCHAR(500) NOT NULL COMMENT '图片URL/路径',
  `thumbnail_url` VARCHAR(500) NOT NULL COMMENT '缩略图路径',
  `file_size` BIGINT NOT NULL COMMENT '文件大小(bytes)',
  `original_filename` VARCHAR(255) NOT NULL COMMENT '原始文件名',
  `shot_date` DATE DEFAULT NULL COMMENT '拍摄日期',
  `tags` JSON DEFAULT NULL COMMENT '标签(JSON数组)',
  `description` TEXT COMMENT '描述',
  `uploader` VARCHAR(100) DEFAULT NULL COMMENT '上传人',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
  FOREIGN KEY (`animal_id`) REFERENCES `animals`(`id`) ON DELETE CASCADE,
  INDEX `idx_animal_id` (`animal_id`),
  INDEX `idx_shot_date` (`shot_date`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='动物图片表';

-- ========================================
-- 备份记录表
-- ========================================
CREATE TABLE IF NOT EXISTS `backup_records` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `file_name` VARCHAR(255) NOT NULL COMMENT '文件名',
  `file_path` VARCHAR(500) NOT NULL COMMENT '文件路径',
  `file_size` BIGINT NOT NULL DEFAULT 0 COMMENT '文件大小(bytes)',
  `backup_type` ENUM('auto', 'manual') NOT NULL DEFAULT 'manual' COMMENT '备份类型',
  `status` ENUM('success', 'failed', 'running') NOT NULL DEFAULT 'running' COMMENT '备份状态',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `duration_ms` BIGINT NOT NULL DEFAULT 0 COMMENT '备份耗时(ms)',
  `remark` TEXT COMMENT '备注',
  INDEX `idx_backup_type` (`backup_type`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='备份记录表';

