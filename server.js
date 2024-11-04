const express = require('express');
const multer = require('multer');
const dotenv = require('dotenv');
const { Telegraf } = require('telegraf');
const path = require('path');
const cors = require('cors');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Обслуживание статических файлов из build
app.use(express.static(path.join(__dirname, 'client/build')));

app.post('/post', upload.single('image'), async (req, res) => {
    const { apiToken, groupId, title, description, links } = req.body;
    const imagePath = req.file?.path;
    const linkButtons = JSON.parse(links).map(link => [{ text: link.text, url: link.url }]);

    console.log('Получен запрос на отправку поста:', { apiToken, groupId, title, description, imagePath, linkButtons });

    if (!imagePath) {
        console.error('Файл не был загружен');
        return res.status(400).send('Файл не был загружен');
    }

    const bot = new Telegraf(apiToken);

    try {
        await bot.telegram.sendPhoto(
            groupId,
            { source: path.join(__dirname, imagePath) },
            {
                caption: `<b>${title}</b>\n\n${description}`,
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: linkButtons
                }
            }
        );
        res.status(200).send('Сообщение отправлено в группу');
    } catch (error) {
        console.error('Ошибка отправки сообщения:', error);
        res.status(500).send('Ошибка отправки сообщения');
    }
});

// Обслуживание остальных запросов для React приложения
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
