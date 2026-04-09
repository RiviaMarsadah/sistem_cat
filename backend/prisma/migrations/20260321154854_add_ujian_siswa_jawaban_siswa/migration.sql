/*
  Warnings:

  - You are about to drop the column `kelas_id` on the `bank_soal` table. All the data in the column will be lost.
  - The values [single_choice,multi_choice,benar_salah] on the enum `jawaban_siswa_tipe_soal` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `jurusan` on the `kelas` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[id_jurusan]` on the table `jurusan` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tingkat,jurusan_id,inisial]` on the table `kelas` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tingkat` to the `bank_soal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id_jurusan` to the `jurusan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `inisial` to the `kelas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jurusan_id` to the `kelas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `kelas` table without a default value. This is not possible if the table is not empty.
  - Made the column `tingkat` on table `kelas` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `bank_soal` DROP FOREIGN KEY `bank_soal_kelas_id_fkey`;

-- DropIndex
DROP INDEX `bank_soal_kelas_id_fkey` ON `bank_soal`;

-- DropIndex
DROP INDEX `users_username_key` ON `users`;

-- AlterTable
ALTER TABLE `bank_soal` DROP COLUMN `kelas_id`,
    ADD COLUMN `jurusan_id` INTEGER NULL,
    ADD COLUMN `tingkat` ENUM('X', 'XI', 'XII', 'SEMUA') NOT NULL,
    MODIFY `kategori_soal` ENUM('pilgan', 'pilgan_kompleks', 'pilgan_kategori') NOT NULL;

-- AlterTable
ALTER TABLE `jurusan` ADD COLUMN `id_jurusan` VARCHAR(20) NOT NULL;

-- AlterTable
ALTER TABLE `kelas` DROP COLUMN `jurusan`,
    ADD COLUMN `inisial` VARCHAR(10) NOT NULL,
    ADD COLUMN `jurusan_id` INTEGER NOT NULL,
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL,
    MODIFY `tingkat` ENUM('X', 'XI', 'XII') NOT NULL;

-- AlterTable
ALTER TABLE `users` DROP COLUMN `username`;

-- CreateTable
CREATE TABLE `paket_ujian` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(200) NOT NULL,
    `mata_pelajaran_id` INTEGER NOT NULL,
    `tingkat` ENUM('X', 'XI', 'XII', 'SEMUA') NOT NULL,
    `tipe_ujian` ENUM('UH', 'UTS', 'UAS', 'Lainnya') NOT NULL,
    `token_checkin` VARCHAR(6) NOT NULL,
    `token_checkout` VARCHAR(6) NOT NULL,
    `guru_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `soal_paket_ujian` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `paket_ujian_id` INTEGER NOT NULL,
    `bank_soal_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `soal_paket_ujian_paket_ujian_id_bank_soal_id_key`(`paket_ujian_id`, `bank_soal_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ujian_siswa` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `siswa_id` INTEGER NOT NULL,
    `paket_ujian_id` INTEGER NOT NULL,
    `status` ENUM('berlangsung', 'selesai') NOT NULL DEFAULT 'berlangsung',
    `random_seed` INTEGER NOT NULL,
    `total_soal` INTEGER NOT NULL DEFAULT 0,
    `benar` INTEGER NOT NULL DEFAULT 0,
    `salah` INTEGER NOT NULL DEFAULT 0,
    `kosong` INTEGER NOT NULL DEFAULT 0,
    `ragu_ragu` INTEGER NOT NULL DEFAULT 0,
    `nilai_akhir` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `mulai_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `selesai_pada` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ujian_siswa_siswa_id_paket_ujian_id_key`(`siswa_id`, `paket_ujian_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `jawaban_siswa` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ujian_siswa_id` INTEGER NOT NULL,
    `bank_soal_id` INTEGER NOT NULL,
    `nomor_soal` INTEGER NOT NULL,
    `tipe_soal` ENUM('pilgan', 'pilgan_kompleks', 'pilgan_kategori') NOT NULL,
    `jawaban_siswa` VARCHAR(255) NULL,
    `status_jawaban` ENUM('dijawab', 'kosong', 'ragu_ragu') NOT NULL DEFAULT 'kosong',
    `is_benar` BOOLEAN NULL,
    `skor_item` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `jawaban_siswa_ujian_siswa_id_nomor_soal_idx`(`ujian_siswa_id`, `nomor_soal`),
    UNIQUE INDEX `jawaban_siswa_ujian_siswa_id_bank_soal_id_key`(`ujian_siswa_id`, `bank_soal_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `jurusan_id_jurusan_key` ON `jurusan`(`id_jurusan`);

-- CreateIndex
CREATE UNIQUE INDEX `kelas_tingkat_jurusan_id_inisial_key` ON `kelas`(`tingkat`, `jurusan_id`, `inisial`);

-- AddForeignKey
ALTER TABLE `kelas` ADD CONSTRAINT `kelas_jurusan_id_fkey` FOREIGN KEY (`jurusan_id`) REFERENCES `jurusan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bank_soal` ADD CONSTRAINT `bank_soal_jurusan_id_fkey` FOREIGN KEY (`jurusan_id`) REFERENCES `jurusan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `paket_ujian` ADD CONSTRAINT `paket_ujian_mata_pelajaran_id_fkey` FOREIGN KEY (`mata_pelajaran_id`) REFERENCES `mata_pelajaran`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `paket_ujian` ADD CONSTRAINT `paket_ujian_guru_id_fkey` FOREIGN KEY (`guru_id`) REFERENCES `guru`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `soal_paket_ujian` ADD CONSTRAINT `soal_paket_ujian_paket_ujian_id_fkey` FOREIGN KEY (`paket_ujian_id`) REFERENCES `paket_ujian`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `soal_paket_ujian` ADD CONSTRAINT `soal_paket_ujian_bank_soal_id_fkey` FOREIGN KEY (`bank_soal_id`) REFERENCES `bank_soal`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ujian_siswa` ADD CONSTRAINT `ujian_siswa_siswa_id_fkey` FOREIGN KEY (`siswa_id`) REFERENCES `siswa`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ujian_siswa` ADD CONSTRAINT `ujian_siswa_paket_ujian_id_fkey` FOREIGN KEY (`paket_ujian_id`) REFERENCES `paket_ujian`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jawaban_siswa` ADD CONSTRAINT `jawaban_siswa_ujian_siswa_id_fkey` FOREIGN KEY (`ujian_siswa_id`) REFERENCES `ujian_siswa`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jawaban_siswa` ADD CONSTRAINT `jawaban_siswa_bank_soal_id_fkey` FOREIGN KEY (`bank_soal_id`) REFERENCES `bank_soal`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
