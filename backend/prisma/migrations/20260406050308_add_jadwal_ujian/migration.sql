-- CreateTable
CREATE TABLE `jadwal_ujian` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(100) NOT NULL,
    `mata_pelajaran_id` INTEGER NOT NULL,
    `mulai_pada` DATETIME(3) NOT NULL,
    `selesai_pada` DATETIME(3) NOT NULL,
    `durasi` INTEGER NOT NULL DEFAULT 60,
    `token` VARCHAR(10) NULL,
    `paket_ujian_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kelas_jadwal` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `jadwal_ujian_id` INTEGER NOT NULL,
    `kelas_id` INTEGER NOT NULL,

    UNIQUE INDEX `kelas_jadwal_jadwal_ujian_id_kelas_id_key`(`jadwal_ujian_id`, `kelas_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `jadwal_ujian` ADD CONSTRAINT `jadwal_ujian_mata_pelajaran_id_fkey` FOREIGN KEY (`mata_pelajaran_id`) REFERENCES `mata_pelajaran`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jadwal_ujian` ADD CONSTRAINT `jadwal_ujian_paket_ujian_id_fkey` FOREIGN KEY (`paket_ujian_id`) REFERENCES `paket_ujian`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kelas_jadwal` ADD CONSTRAINT `kelas_jadwal_jadwal_ujian_id_fkey` FOREIGN KEY (`jadwal_ujian_id`) REFERENCES `jadwal_ujian`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kelas_jadwal` ADD CONSTRAINT `kelas_jadwal_kelas_id_fkey` FOREIGN KEY (`kelas_id`) REFERENCES `kelas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
