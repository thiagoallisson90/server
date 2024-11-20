import express, { json, Request, Response } from "express";
import { Sequelize, DataTypes, Model } from "sequelize";
import cors from "cors"; // Importando o CORS

const app = express();
const PORT = 3100;

app.use(json());
app.use(cors());

// Configuração do Sequelize para SQLite
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./sensor_data.db",
});

// Definição do modelo de dados
// Device model
class Devices extends Model {
  public id!: number;
  public name!: string;
  public rec!: number;
  public sent!: number;
  public lat?: number;
  public long?: number;
  public timestamp!: Date;

  // Association
  public static associate(models: any) {
    Devices.hasMany(models.SensorData, {
      foreignKey: "device_id", // Chave estrangeira em SensorData
      as: "sensorData", // Alias para a associação
    });
  }
}

Devices.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    rec: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    sent: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    lat: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    long: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize, // Instância do Sequelize
    tableName: "Devices", // Nome da tabela no banco de dados
    timestamps: false, // Desativar createdAt/updatedAt se não forem necessários
  }
);

async function findDeviceByDeviceId(device_id: string) {
  try {
    // Busca o dispositivo pelo device_id
    const device = await Devices.findOne({
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
  } catch (error) {
    console.error("Error finding device:", error);
    throw error; // Repassa o erro para o chamador
  }
}

class SensorData extends Model {
  public id!: number;
  public temperature!: number;
  public humidity!: number;
  public luminosity!: number;
  public rssi!: number;
  public device_id!: number; // Chave estrangeira para o dispositivo
  public timestamp!: Date;

  // Associação entre SensorData e Device
  public static associate(models: any) {
    SensorData.belongsTo(models.Devices, {
      foreignKey: "device_id", // Chave estrangeira referenciando Device
      as: "device", // Alias para a associação
    });
  }
}

SensorData.init(
  {
    temperature: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    humidity: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    luminosity: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    rssi: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    device_id: {
      type: DataTypes.INTEGER, // Alterado para INTEGER para refletir a chave estrangeira
      allowNull: false,
      references: {
        model: "Devices", // Nome da tabela referenciada
        key: "id", // Campo chave primária de Devices
      },
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "SensorData",
    timestamps: false,
  }
);

// Sincronizar com o banco de dados
sequelize
  .sync()
  .then(() => console.log("Banco de dados sincronizado"))
  .catch((err) => console.error("Erro ao sincronizar o banco de dados:", err));

// Endpoint para recuperar dados via GET
app.get("/data", async (_req: Request, res: Response) => {
  try {
    const data = await SensorData.findAll();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "Error retrieving data" });
  }
});

app.get("/devs", async (_req: Request, res: Response) => {
  try {
    const devs = await Devices.findAll();
    res.status(200).json(devs);
  } catch (error) {
    res.status(500).json({ error: "Error retrieving devices" });
  }
});

app.get("/devs/:dev_id", async (_req: Request, res: Response) => {
  try {
    const devs = await findDeviceByDeviceId(_req.params.dev_id);
    res.status(200).json(devs);
  } catch (error) {
    res.status(500).json({ error: "Error retrieving devices" });
  }
});

// Endpoint para receber dados via POST
//@ts-ignore
app.post("/data", async (req: Request, res: Response) => {
  const {
    device_id,
    temperature,
    humidity,
    luminosity,
    rssi,
    counter,
    lat,
    long,
  } = req.body;

  // Validação dos dados de entrada
  if (
    !device_id ||
    temperature === undefined ||
    humidity === undefined ||
    luminosity === undefined ||
    rssi === undefined ||
    counter === undefined
  ) {
    return res.status(400).json({ error: "Invalid data format" });
  }

  try {
    // Verificar se o dispositivo já existe
    let dev = await findDeviceByDeviceId(device_id); // Procurando pelo 'name' (device_id)

    if (dev) {
      // Atualiza o valor de rec (incrementa em 1)
      dev.rec += 1;
      dev.sent = counter; // Atualiza o campo 'sent' com o valor do contador
      await dev.save(); // Salva as mudanças no banco de dados
    } else {
      // Se não existir, cria o dispositivo com rec inicial como 1
      dev = await Devices.create({
        name: device_id, // 'name' será o identificador único
        sent: counter, // Inicializa com o valor do contador
        rec: 1, // rec começa com 1
        lat, // Adiciona a latitude
        long, // Adiciona a longitude
      });
    }

    // Cria os dados do sensor
    const newData = await SensorData.create({
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
  } catch (error) {
    // Em caso de erro
    console.error("Error saving data:", error);
    res.status(500).json({ error: "Error saving data" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
