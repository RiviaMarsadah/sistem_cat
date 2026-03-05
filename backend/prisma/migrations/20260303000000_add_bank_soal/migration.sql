-- CreateTable
CREATE TABLE `bank_soal` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `mata_pelajaran_id` INTEGER NOT NULL,
    `kelas_id` INTEGER NOT NULL,
    `guru_id` INTEGER NOT NULL,
    `kategori_soal` ENUM('single_choice', 'multi_choice', 'benar_salah') NOT NULL,
    `soal` TEXT NULL,
    `kolom_a` VARCHAR(500) NULL,
    `kolom_b` VARCHAR(500) NULL,
    `kolom_c` VARCHAR(500) NULL,
    `kolom_d` VARCHAR(500) NULL,
    `kolom_e` VARCHAR(500) NULL,
    `kolom_f` VARCHAR(500) NULL,
    `jawaban` VARCHAR(100) NOT NULL,
    `gambar` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `bank_soal` ADD CONSTRAINT `bank_soal_mata_pelajaran_id_fkey` FOREIGN KEY (`mata_pelajaran_id`) REFERENCES `mata_pelajaran`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bank_soal` ADD CONSTRAINT `bank_soal_kelas_id_fkey` FOREIGN KEY (`kelas_id`) REFERENCES `kelas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bank_soal` ADD CONSTRAINT `bank_soal_guru_id_fkey` FOREIGN KEY (`guru_id`) REFERENCES `guru`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
