// 




const db = require('../config/db');

const ALLOWED_STATUSES = [
  'idea',
  'scripting',
  'recording',
  'editing',
  'review',
  'revision',
  'ready',
  'published',
];

const ALLOWED_FORMATS = [
  'short_video',
  'long_video',
  'carousel',
  'single_post',
];

const ALLOWED_PRIORITIES = ['low', 'medium', 'high'];

const CONTENT_SELECT = `
  SELECT
    c.*,
    ch.platform,
    ch.handle_name,
    owner.name AS creator_name,
    editor.name AS editor_name
  FROM contents c
  LEFT JOIN channels ch ON ch.id = c.channel_id
  LEFT JOIN users owner ON owner.id = c.user_id
  LEFT JOIN users editor ON editor.id = c.editor_id
`;

function isAdmin(req) {
  return req.user.role === 'admin';
}

async function getContentById(id) {
  const [rows] = await db.query(
    `${CONTENT_SELECT} WHERE c.id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function validateChannel(channelId) {
  const [rows] = await db.query(
    'SELECT id FROM channels WHERE id = ?',
    [channelId]
  );
  return rows.length > 0;
}

async function validateEditor(editorId) {
  if (editorId === null || editorId === '') return true;
  const id = Number(editorId);
  if (!Number.isSafeInteger(id) || id <= 0) return false;
  const [rows] = await db.query(
    "SELECT id FROM users WHERE id = ? AND role = 'editor'",
    [id]
  );
  return rows.length > 0;
}

// async function getContents(req, res) {
//   try {
//     let sql = CONTENT_SELECT;
//     const params = [];

//     if (req.user.role === 'creator') {
//       sql += ' WHERE c.user_id = ?';
//       params.push(req.user.id);
//     } else if (!isAdmin(req) && req.user.role !== 'editor') {
//       return res.status(403).json({
//         success: false,
//         message: 'Kamu tidak memiliki akses melihat konten.',
//       });
//     }

//     sql += ' ORDER BY c.created_at DESC';
//     const [contents] = await db.query(sql, params);

//     return res.status(200).json({
//       success: true,
//       message: 'Daftar konten berhasil diambil.',
//       data: contents,
//     });
//   } catch (error) {
//     console.error('Get contents error:', error.message);
//     return res.status(500).json({
//       success: false,
//       message: 'Gagal mengambil daftar konten.',
//     });
//   }
// }

async function getContents(req, res) {
  try {
    const userRole = req.user.role;
    const userId = Number(req.user.id);

    let query = `
      SELECT 
        c.*, 
        ch.platform, 
        ch.handle_name,
        u_editor.name AS editor_name
      FROM contents c
      LEFT JOIN channels ch ON ch.id = c.channel_id
      LEFT JOIN users u_editor ON u_editor.id = c.editor_id
    `;

    const queryParams = [];

    // 1. JIKA ROLE EDITOR: Hanya tampilkan konten yang di-assign ke ID Editor ini
    if (userRole === 'editor') {
      query += ` WHERE c.editor_id = ?`;
      queryParams.push(userId);
    } 
    // 2. JIKA ROLE CREATOR: Hanya tampilkan konten yang dibuat oleh ID Creator ini
    else if (userRole === 'creator') {
      query += ` WHERE c.user_id = ?`;
      queryParams.push(userId);
    }
    // 3. JIKA ROLE ADMIN: Tanpa WHERE (bisa melihat seluruh konten dari semua Creator & Editor)

    query += ` ORDER BY c.created_at DESC`;

    const [contents] = await db.query(query, queryParams);

    return res.status(200).json({
      success: true,
      data: contents,
    });
  } catch (error) {
    console.error('Get contents error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil daftar konten.',
    });
  }
}



async function getContentDetail(req, res) {
  try {
    const contentId = Number(req.params.id);
    if (!Number.isSafeInteger(contentId) || contentId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID konten tidak valid.',
      });
    }

    const content = await getContentById(contentId);
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Konten tidak ditemukan.',
      });
    }

    if (req.user.role === 'creator' && Number(content.user_id) !== Number(req.user.id)) {
      return res.status(404).json({
        success: false,
        message: 'Konten tidak ditemukan.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Detail konten berhasil diambil.',
      data: content,
    });
  } catch (error) {
    console.error('Get content detail error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil detail konten.',
    });
  }
}

async function createContent(req, res) {
  try {
    const {
      user_id,
      channel_id,
      editor_id,
      title,
      description,
      script_draft,
      format_type,
      priority,
      scheduled_date,
    } = req.body;

    if (typeof title !== 'string' || !title.trim() || !channel_id || !format_type) {
      return res.status(400).json({
        success: false,
        message: 'title, channel_id, dan format_type wajib diisi.',
      });
    }

    if (!ALLOWED_FORMATS.includes(format_type)) {
      return res.status(400).json({
        success: false,
        message: 'format_type tidak valid.',
      });
    }

    const selectedPriority = priority || 'medium';
    if (!ALLOWED_PRIORITIES.includes(selectedPriority)) {
      return res.status(400).json({
        success: false,
        message: 'priority tidak valid.',
      });
    }

    if (!['creator', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Hanya creator dan admin yang bisa membuat konten.',
      });
    }

    let ownerId = Number(req.user.id);
    if (isAdmin(req) && user_id !== undefined) {
      ownerId = Number(user_id);
    }

    const [owners] = await db.query(
      "SELECT id FROM users WHERE id = ?",
      [ownerId]
    );

    if (!owners.length) {
      return res.status(400).json({
        success: false,
        message: 'Pemilik konten tidak valid.',
      });
    }

    const channelId = Number(channel_id);
    if (!Number.isSafeInteger(channelId) || !(await validateChannel(channelId))) {
      return res.status(400).json({
        success: false,
        message: 'Channel tidak ditemukan.',
      });
    }

    let selectedEditorId = null;
    if (editor_id !== undefined && editor_id !== null && editor_id !== '') {
      if (!(await validateEditor(editor_id))) {
        return res.status(400).json({
          success: false,
          message: 'Editor yang dipilih tidak valid.',
        });
      }
      selectedEditorId = Number(editor_id);
    }

    const [result] = await db.query(
      `INSERT INTO contents (
        user_id,
        editor_id,
        channel_id,
        title,
        description,
        script_draft,
        format_type,
        status,
        priority,
        scheduled_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'idea', ?, ?)`,
      [
        ownerId,
        selectedEditorId,
        channelId,
        title.trim(),
        description || null,
        script_draft || null,
        format_type,
        selectedPriority,
        scheduled_date || null,
      ]
    );

    const content = await getContentById(result.insertId);

    return res.status(201).json({
      success: true,
      message: 'Konten berhasil dibuat.',
      data: content,
    });
  } catch (error) {
    console.error('Create content error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Gagal membuat konten.',
    });
  }
}


// async function updateContent(req, res) {
//   try {
//     const contentId = req.params.id;
//     const userRole = req.user.role;

//     const { 
//       title, 
//       channel_id, 
//       editor_id, 
//       format_type, 
//       priority, 
//       scheduled_date, 
//       published_date,
//       script_draft, 
//       description, 
//       published_url, 
//       editing_link 
//     } = req.body;

//     // 1. LOGIKA EDITOR (Hanya update editing_link dan published_url)
//     if (userRole === 'editor') {
//       const [result] = await db.query(
//         `UPDATE contents 
//          SET editing_link = ?, published_url = ? 
//          WHERE id = ? AND editor_id = ?`,
//         [
//           editing_link || null, 
//           published_url || null, 
//           contentId, 
//           req.user.id
//         ]
//       );

//       if (result.affectedRows === 0) {
//         return res.status(403).json({
//           success: false,
//           message: 'Gagal memperbarui: Konten tidak ditugaskan ke kamu.',
//         });
//       }

//       return res.status(200).json({
//         success: true,
//         message: 'Hasil editing & Published URL berhasil diperbarui.',
//       });
//     }

//     // 2. LOGIKA ADMIN & CREATOR (Update seluruh field)
//     const [result] = await db.query(
//       `UPDATE contents SET 
//         title = ?, 
//         channel_id = ?, 
//         editor_id = ?, 
//         format_type = ?, 
//         priority = ?, 
//         scheduled_date = ?, 
//         published_date = ?,
//         script_draft = ?, 
//         description = ?, 
//         published_url = ?, 
//         editing_link = ?
//        WHERE id = ?`,
//       [
//         title, 
//         channel_id || null, 
//         editor_id || null, 
//         format_type || 'short_video', 
//         priority || 'medium', 
//         scheduled_date || null, 
//         published_date || null,
//         script_draft || null, 
//         description || null, 
//         published_url || null, 
//         editing_link || null, 
//         contentId
//       ]
//     );

//     return res.status(200).json({
//       success: true,
//       message: 'Konten berhasil diperbarui.',
//     });
//   } catch (error) {
//     // TAMPILKAN LOG ERROR DETAIL DI TERMINAL BACKEND (VS CODE / COMMAND PROMPT)
//     console.error('=== ERROR UPDATE CONTENT DETAIL ===');
//     console.error(error);
//     console.error('==================================');

//     return res.status(500).json({
//       success: false,
//       message: `Gagal memperbarui konten: ${error.message}`,
//     });
//   }
// }

async function updateContent(req, res) {
  try {
    const contentId = req.params.id;
    const userRole = req.user.role;
    const userId = Number(req.user.id);

    const { 
      title, 
      channel_id, 
      editor_id, 
      format_type, 
      priority, 
      scheduled_date, 
      published_date,
      script_draft, 
      description, 
      asset_link, 
      published_url, 
      editing_link 
    } = req.body;

    // 1. LOGIKA EDITOR (Hanya update editing_link dan published_url)
    if (userRole === 'editor') {
      const [result] = await db.query(
        `UPDATE contents 
         SET editing_link = ?, published_url = ? 
         WHERE id = ? AND editor_id = ?`,
        [
          editing_link || null, 
          published_url || null, 
          contentId, 
          req.user.id
        ]
      );

      if (result.affectedRows === 0) {
        return res.status(403).json({
          success: false,
          message: 'Gagal memperbarui: Konten tidak ditugaskan ke kamu.',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Hasil editing & Published URL berhasil diperbarui.',
      });
    }

    // 1.5. PROTEKSI CREATOR (Cek agar Creator hanya bisa update konten miliknya)
    if (userRole === 'creator') {
      const [existing] = await db.query(
        'SELECT user_id FROM contents WHERE id = ?',
        [contentId]
      );

      if (!existing.length) {
        return res.status(404).json({
          success: false,
          message: 'Konten tidak ditemukan.',
        });
      }

      if (Number(existing[0].user_id) !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Kamu tidak memiliki izin mengubah konten milik Creator lain.',
        });
      }
    }

    // 2. LOGIKA ADMIN & CREATOR (Update seluruh field termasuk asset_link)
    const [result] = await db.query(
      `UPDATE contents SET 
        title = ?, 
        channel_id = ?, 
        editor_id = ?, 
        format_type = ?, 
        priority = ?, 
        scheduled_date = ?, 
        published_date = ?,
        script_draft = ?, 
        description = ?, 
        asset_link = ?, 
        published_url = ?, 
        editing_link = ?
       WHERE id = ?`,
      [
        title, 
        channel_id || null, 
        editor_id || null, 
        format_type || 'short_video', 
        priority || 'medium', 
        scheduled_date || null, 
        published_date || null,
        script_draft || null, 
        description || null, 
        asset_link || null, 
        published_url || null, 
        editing_link || null, 
        contentId
      ]
    );

    return res.status(200).json({
      success: true,
      message: 'Konten berhasil diperbarui.',
    });
  } catch (error) {
    // TAMPILKAN LOG ERROR DETAIL DI TERMINAL BACKEND (VS CODE / COMMAND PROMPT)
    console.error('=== ERROR UPDATE CONTENT DETAIL ===');
    console.error(error);
    console.error('==================================');

    return res.status(500).json({
      success: false,
      message: `Gagal memperbarui konten: ${error.message}`,
    });
  }
}

async function deleteContent(req, res) {
  try {
    const contentId = Number(req.params.id);
    await db.query('DELETE FROM contents WHERE id = ?', [contentId]);
    return res.status(200).json({ success: true, message: 'Konten berhasil dihapus.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Gagal menghapus konten.' });
  }
}

async function advanceProductionStatus(req, res) {
  try {
    const contentId = Number(req.params.id);
    const { status } = req.body;
    await db.query('UPDATE contents SET status = ?, updated_at = NOW() WHERE id = ?', [status, contentId]);
    return res.status(200).json({ success: true, message: 'Status berhasil diperbarui.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Gagal mengubah status.' });
  }
}

async function submitForEditing(req, res) { return res.status(200).json({ success: true }); }
async function startEditing(req, res) { return res.status(200).json({ success: true }); }
async function completeEditing(req, res) { return res.status(200).json({ success: true }); }
async function requestRevision(req, res) { return res.status(200).json({ success: true }); }
async function approveContent(req, res) { return res.status(200).json({ success: true }); }
async function publishContent(req, res) { return res.status(200).json({ success: true }); }

module.exports = {
  getContents,
  getContentDetail,
  createContent,
  updateContent,
  deleteContent,
  submitForEditing,
  startEditing,
  completeEditing,
  requestRevision,
  approveContent,
  publishContent,
  advanceProductionStatus,
};