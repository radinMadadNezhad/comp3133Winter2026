const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const inputFile = path.join(__dirname, "input_countries.csv");
const canadaFile = path.join(__dirname, "canada.txt");
const usaFile = path.join(__dirname, "usa.txt");

function deleteIfExists(filePath) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`Deleted existing file: ${path.basename(filePath)}`);
  }
}

deleteIfExists(canadaFile);
deleteIfExists(usaFile);

const canadaStream = fs.createWriteStream(canadaFile, { flags: "a" });
const usaStream = fs.createWriteStream(usaFile, { flags: "a" });

canadaStream.write("country,year,population\n");
usaStream.write("country,year,population\n");

fs.createReadStream(inputFile)
  .pipe(csv())
  .on("data", (row) => {
    
    const country = (row.country || "").trim().toLowerCase();
    const year = (row.year || "").trim();
    const population = (row.population || "").trim();

    if (country === "canada") {
      canadaStream.write(`canada,${year},${population}\n`);
    }

    if (country === "united states" || country === "united states of america") {
      usaStream.write(`united states,${year},${population}\n`);
    }
  })
  .on("end", () => {
    canadaStream.end();
    usaStream.end();
    console.log("Done! Created canada.txt and usa.txt");
  })
  .on("error", (err) => {
    console.error("Error reading CSV:", err);
  });
