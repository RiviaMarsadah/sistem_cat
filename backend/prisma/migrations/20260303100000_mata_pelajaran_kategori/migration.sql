-- AlterTable: add kategori and jurusan_id to mata_pelajaran
ALTER TABLE `mata_pelajaran` ADD COLUMN `kategori` ENUM('prodi', 'muatan_lokal') NOT NULL DEFAULT 'prodi';
ALTER TABLE `mata_pelajaran` ADD COLUMN `jurusan_id` INTEGER NULL;

-- AddForeignKey (run only if mata_pelajaran doesn't have updated_at; if it does, adjust)
-- MySQL: add FK after column exists
ALTER TABLE `mata_pelajaran` ADD CONSTRAINT `mata_pelajaran_jurusan_id_fkey` FOREIGN KEY (`jurusan_id`) REFERENCES `jurusan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
