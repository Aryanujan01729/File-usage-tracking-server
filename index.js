const express = require('express');
const path = require('path');
const multer = require('multer');
const { GridFSBucket } = require('mongodb');
const fs = require('fs');
const mongoose = require('mongoose');

const app = express();
const PORT = 3000; // Changed port to 3000

app.set('trust proxy', true);
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        return cb(null, "./uploads");
    },
    fileFilter: (req, file, cb) => {
        // Accept any file type
        cb(null, true);
    },
    filename: function (req, file, cb) {
        return cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const upload = multer({ storage });
const pth = [];

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: false }));
const directoryPath = path.join(__dirname, 'uploads'); // Replace 'your-folder-name' with your folder
const logfilePath = path.join(__dirname, 'FileAccessLog.txt');
// Consolidated single route for '/'

app.get('/', (req, res) => {
    const userIp = req.ip;
    
const content = `Server is opened byIP: ${userIp}  on date : ${new Date().toISOString()}\n`;

// Write to the file
fs.appendFile(logfilePath, content, (err) => {
    if (err) {
        return console.error(`Error writing to file: ${err}`);
    }
    console.log('File written successfully!');
});

    
    console.log(`Server is opened byIP: ${userIp}`);
    

    fs.readdir(directoryPath, (err, files) => {
        if (err) {
            return res.status(500).send('Unable to scan directory: ' + err);
        }
        for (let i = 0; i < files.length; i++) {
            pth.push(encodeURIComponent(files[i]));
            console.log(encodeURIComponent(files[i]));
            //const fileUrl = `/file/${encodeURIComponent(file)}`;
        }
        console.log("********************")
        console.log(files.length);

        // Render the EJS template and pass the list of files and paths
        res.render('homepage', { title: 'Home Page', files, pth });
    });
});

app.get('/filename/:filename', (req, res) => {

    
    const fileName = req.params.filename;
    const filePath = path.join(directoryPath, fileName);

    const userIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    
    

    //console.log(`User IP: ${userIp} accessed file: ${fileName}`);

   

    // Write to the file
    const con = `User IP: ${userIp} accessed file: ${fileName} on date: ${new Date().toISOString()}\n`;

    // Append log to the file
    fs.appendFile(logfilePath, con, (err) => {
        if (err) {
            return console.error(`Error writing to log file: ${err}`);
        }
        console.log('Log written successfully!');
    });


    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('File not found');
    }

});


app.post('/upload', upload.single('Files'), async (req, res) => {
    mongoose.connect('mongodb://localhost:27017/UploadedFiles', {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    const conn = mongoose.connection;
    conn.on('error', console.error.bind(console, 'connection error:'));
    conn.once('open', () => {
        console.log('Connected to MongoDB');

        // Initialize GridFSBucket
        const bucket = new GridFSBucket(conn.db, {
            bucketName: 'uploads'
        });

        // Path to the PDF file
        const pdfPath = req.file.path; // path.join((req.file).path, (req.file).filename);

        // Create a write stream
        const uploadStream = bucket.openUploadStream('Form.pdf', {
            contentType: 'application/pdf'
        });

        // Read the PDF file and pipe it to the write stream
        fs.createReadStream(pdfPath).pipe(uploadStream)
            .on('error', (error) => {
                console.error('Error uploading file:', error);
            })
            .on('finish', () => {
                console.log('PDF file has been written to MongoDB');
            });
    });
    console.log(req.body);
    console.log(req.file);
    return res.redirect('/');
});

app.listen(PORT, () => console.log(`Server started on PORT ${PORT}`));
