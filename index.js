"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const sequelize_1 = require("sequelize");
const cors_1 = __importDefault(require("cors")); // Importando o CORS
const app = (0, express_1.default)();
const PORT = 3000;
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    app.use((0, cors_1.default)());
    next();
});
// Configuração do Sequelize para SQLite
const sequelize = new sequelize_1.Sequelize({
    dialect: "sqlite",
    storage: "./sensor_data.db",
});
// Definição do modelo de dados
class SensorData extends sequelize_1.Model {
}
SensorData.init({
    device_id: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    temperature: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false,
    },
    humidity: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false,
    },
    luminosity: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false,
    },
    rssi: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false,
    },
    lat: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: true,
    },
    long: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: true,
    },
    counter: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
    },
    timestamp: {
        type: sequelize_1.DataTypes.DATE,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
}, {
    sequelize,
    modelName: "SensorData",
    timestamps: false,
});
app.use(body_parser_1.default.json());
// Sincronizar com o banco de dados
sequelize
    .sync()
    .then(() => console.log("Banco de dados sincronizado"))
    .catch((err) => console.error("Erro ao sincronizar o banco de dados:", err));
// Endpoint para receber dados via POST
//@ts-ignore
app.post("/data", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { device_id, temperature, humidity, luminosity, rssi, counter } = req.body;
    if (!device_id ||
        temperature === undefined ||
        humidity === undefined ||
        luminosity === undefined ||
        rssi === undefined) {
        return res.status(400).json({ error: "Invalid data format" });
    }
    try {
        const newData = yield SensorData.create({
            device_id,
            temperature,
            humidity,
            luminosity,
            rssi,
        });
        res
            .status(201)
            .json({ message: "Data received successfully", data: newData });
    }
    catch (error) {
        res.status(500).json({ error: "Error saving data" });
    }
}));
// Endpoint para recuperar dados via GET
app.get("/data", (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield SensorData.findAll();
        res.status(200).json(data);
    }
    catch (error) {
        res.status(500).json({ error: "Error retrieving data" });
    }
}));
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
