
const db = require('../config/db');

const ALLOWED_PLATFORMS = [
  'youtube',
  'tiktok',
  'instagram',
  'linkedin',
];

async function getChannels(req, res) {
  try {
    // Hapus 'WHERE user_id = ?' agar semua creator bisa melihat daftar semua channel
    const [channels] = await db.query('SELECT * FROM channels ORDER BY created_at DESC');

    return res.status(200).json({
      success: true,
      data: channels,
    });
  } catch (error) {
    console.error('Get channels error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil daftar channel.' });
  }
}

module.exports = { getChannels };

// async function createChannel(req, res) {
//   try {
//     const { platform, handle_name } = req.body;

//     if (
//       typeof platform !== 'string' ||
//       typeof handle_name !== 'string' ||
//       !platform.trim() ||
//       !handle_name.trim()
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: 'Platform dan handle_name wajib diisi.',
//       });
//     }

//     const normalizedPlatform = platform.trim().toLowerCase();
//     const normalizedHandle = handle_name.trim();

//     if (!ALLOWED_PLATFORMS.includes(normalizedPlatform)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Platform tidak valid.',
//       });
//     }

//     let ownerId = Number(req.user.id);

//     if (req.user.role === 'admin') {
//       if (req.body.user_id !== undefined) {
//         ownerId = Number(req.body.user_id);
//       }
//     } else if (req.user.role !== 'creator') {
//       return res.status(403).json({
//         success: false,
//         message: 'Kamu tidak memiliki akses menambahkan channel.',
//       });
//     }

//     if (!Number.isSafeInteger(ownerId) || ownerId <= 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'user_id tidak valid.',
//       });
//     }

//     const [owners] = await db.query(
//       'SELECT id, name, role FROM users WHERE id = ?',
//       [ownerId]
//     );

//     if (!owners.length) {
//       return res.status(404).json({
//         success: false,
//         message: 'Pemilik channel tidak ditemukan.',
//       });
//     }

//     if (owners[0].role !== 'creator') {
//       return res.status(400).json({
//         success: false,
//         message: 'Channel harus dimiliki oleh creator.',
//       });
//     }

//     const [result] = await db.query(
//       `INSERT INTO channels (user_id, platform, handle_name)
//        VALUES (?, ?, ?)`,
//       [ownerId, normalizedPlatform, normalizedHandle]
//     );

//     const [rows] = await db.query(
//       `SELECT
//          ch.id,
//          ch.user_id,
//          ch.platform,
//          ch.handle_name,
//          ch.created_at,
//          u.name AS owner_name
//        FROM channels ch
//        JOIN users u ON u.id = ch.user_id
//        WHERE ch.id = ?`,
//       [result.insertId]
//     );

//     return res.status(201).json({
//       success: true,
//       message: 'Channel berhasil ditambahkan.',
//       data: rows[0],
//     });
//   } catch (error) {
//     console.error('Create channel error:', error.message);

//     return res.status(500).json({
//       success: false,
//       message: 'Gagal menambahkan channel.',
//     });
//   }
// }

async function createChannel(req, res) {
  try {
    const { platform, handle_name } = req.body;

    if (
      typeof platform !== 'string' ||
      typeof handle_name !== 'string' ||
      !platform.trim() ||
      !handle_name.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Platform dan handle_name wajib diisi.',
      });
    }

    const normalizedPlatform = platform.trim().toLowerCase();
    const normalizedHandle = handle_name.trim();

    if (!ALLOWED_PLATFORMS.includes(normalizedPlatform)) {
      return res.status(400).json({
        success: false,
        message: 'Platform tidak valid.',
      });
    }

    let ownerId = Number(req.user.id);

    // Cek Role Pembuat Request (Hanya Admin & Creator yang boleh)
    if (req.user.role === 'admin') {
      if (req.body.user_id !== undefined && req.body.user_id !== null) {
        ownerId = Number(req.body.user_id);
      }
    } else if (req.user.role !== 'creator') {
      return res.status(403).json({
        success: false,
        message: 'Kamu tidak memiliki akses menambahkan channel.',
      });
    }

    if (!Number.isSafeInteger(ownerId) || ownerId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'user_id tidak valid.',
      });
    }

    const [owners] = await db.query(
      'SELECT id, name, role FROM users WHERE id = ?',
      [ownerId]
    );

    if (!owners.length) {
      return res.status(404).json({
        success: false,
        message: 'Pemilik channel tidak ditemukan.',
      });
    }

    // PERBAIKAN DI SINI: Izinkan pemilik channel ber-role 'admin' ATAU 'creator'
    if (!['admin', 'creator'].includes(owners[0].role)) {
      return res.status(400).json({
        success: false,
        message: 'Channel harus dimiliki oleh Admin atau Creator.',
      });
    }

    const [result] = await db.query(
      `INSERT INTO channels (user_id, platform, handle_name)
       VALUES (?, ?, ?)`,
      [ownerId, normalizedPlatform, normalizedHandle]
    );

    const [rows] = await db.query(
      `SELECT
         ch.id,
         ch.user_id,
         ch.platform,
         ch.handle_name,
         ch.created_at,
         u.name AS owner_name
       FROM channels ch
       JOIN users u ON u.id = ch.user_id
       WHERE ch.id = ?`,
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: 'Channel berhasil ditambahkan.',
      data: rows[0],
    });
  } catch (error) {
    console.error('Create channel error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Gagal menambahkan channel.',
    });
  }
}

module.exports = {
  getChannels,
  createChannel,
};
