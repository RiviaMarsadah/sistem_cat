-- AlterTable
ALTER TABLE `bank_soal` ADD COLUMN `bank_soal_koleksi_id` INTEGER NULL;

-- CreateTable
CREATE TABLE `bank_soal_koleksi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `guru_id` INTEGER NOT NULL,
    `nama` VARCHAR(120) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `bank_soal_koleksi_guru_id_nama_key`(`guru_id`, `nama`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `bank_soal_koleksi` ADD CONSTRAINT `bank_soal_koleksi_guru_id_fkey` FOREIGN KEY (`guru_id`) REFERENCES `guru`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bank_soal` ADD CONSTRAINT `bank_soal_bank_soal_koleksi_id_fkey` FOREIGN KEY (`bank_soal_koleksi_id`) REFERENCES `bank_soal_koleksi`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
