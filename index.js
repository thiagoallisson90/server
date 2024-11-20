"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const express_1 = __importStar(require("express"));
const sequelize_1 = require("sequelize");
const cors_1 = __importDefault(require("cors")); // Importando o CORS
const app = (0, express_1.default)();
const PORT = 3100;
app.use((0, express_1.json)());
app.use((0, cors_1.default)());
// Configuração do Sequelize para SQLite
const sequelize = new sequelize_1.Sequelize({
    dialect: "sqlite",
    storage: "./sensor_data.db",
});
// Definição do modelo de dados
// Device model
class Devices extends sequelize_1.Model {
    // Association
    static associate(models) {
        Devices.hasMany(models.SensorData, {
            foreignKey: "device_id", // Chave estrangeira em SensorData
            as: "sensorData", // Alias para a associação
        });
    }
}
Devices.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    rec: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    sent: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    lat: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: true,
    },
    long: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: true,
    },
    timestamp: {
        type: sequelize_1.DataTypes.DATE,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
}, {
    sequelize, // Instância do Sequelize
    tableName: "Devices", // Nome da tabela no banco de dados
    timestamps: false, // Desativar createdAt/updatedAt se não forem necessários
});
function findDeviceByDeviceId(device_id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Busca o dispositivo pelo device_id
            const device = yield Devices.findOne({
                where: {
                    name: device_id, // Alterado para buscar pelo 'name'
                },
            });
            // Se o dispositivo não for encontrado, retorna null
            if (!device) {
                console.log(`Device with name "${device_id}" not found.`);
                return null;
            }
            return device;
        }
        catch (error) {
            console.error("Error finding device:", error);
            throw error; // Repassa o erro para o chamador
        }
    });
}
class SensorData extends sequelize_1.Model {
    // Associação entre SensorData e Device
    static associate(models) {
        SensorData.belongsTo(models.Devices, {
            foreignKey: "device_id", // Chave estrangeira referenciando Device
            as: "device", // Alias para a associação
        });
    }
}
SensorData.init({
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
    device_id: {
        type: sequelize_1.DataTypes.INTEGER, // Alterado para INTEGER para refletir a chave estrangeira
        allowNull: false,
        references: {
            model: "Devices", // Nome da tabela referenciada
            key: "id", // Campo chave primária de Devices
        },
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
// Sincronizar com o banco de dados
sequelize
    .sync()
    .then(() => console.log("Banco de dados sincronizado"))
    .catch((err) => console.error("Erro ao sincronizar o banco de dados:", err));
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
app.get("/devs", (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const devs = yield Devices.findAll();
        const devsWithPdr = devs.map((dev) => {
            return Object.assign(Object.assign({}, dev.toJSON()), { pdr: (1.0 * dev.rec) / dev.sent });
        });
        res.status(200).json(devsWithPdr);
    }
    catch (error) {
        res.status(500).json({ error: "Error retrieving devices" });
    }
}));
app.get("/devs/:dev_id", (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const devs = yield findDeviceByDeviceId(_req.params.dev_id);
        res.status(200).json(devs);
    }
    catch (error) {
        res.status(500).json({ error: "Error retrieving devices" });
    }
}));
// Endpoint para receber dados via POST
//@ts-ignore
app.post("/data", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { device_id, temperature, humidity, luminosity, rssi, counter, lat, long, } = req.body;
    // Validação dos dados de entrada
    if (!device_id ||
        temperature === undefined ||
        humidity === undefined ||
        luminosity === undefined ||
        rssi === undefined ||
        counter === undefined) {
        return res.status(400).json({ error: "Invalid data format" });
    }
    try {
        // Verificar se o dispositivo já existe
        let dev = yield findDeviceByDeviceId(device_id); // Procurando pelo 'name' (device_id)
        if (dev) {
            // Atualiza o valor de rec (incrementa em 1)
            dev.rec += 1;
            dev.sent = counter; // Atualiza o campo 'sent' com o valor do contador
            yield dev.save(); // Salva as mudanças no banco de dados
        }
        else {
            // Se não existir, cria o dispositivo com rec inicial como 1
            dev = yield Devices.create({
                name: device_id, // 'name' será o identificador único
                sent: counter, // Inicializa com o valor do contador
                rec: 1, // rec começa com 1
                lat, // Adiciona a latitude
                long, // Adiciona a longitude
            });
        }
        // Cria os dados do sensor
        const newData = yield SensorData.create({
            temperature,
            humidity,
            luminosity,
            rssi,
            device_id: dev.id, // Usa o ID do dispositivo
        });
        // Responde com sucesso
        res
            .status(201)
            .json({ message: "Data received successfully", data: newData });
    }
    catch (error) {
        // Em caso de erro
        console.error("Error saving data:", error);
        res.status(500).json({ error: "Error saving data" });
    }
}));
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
