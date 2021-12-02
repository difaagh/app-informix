import { InformixQueryBuilder, IQueryBuilder } from "./queryBuilder";
import ifxnjs = require("./informix/ifx");
//@ts-ignore
import { Pool, Database } from "ibm_db";

export type IAppInformix = {
  logs: boolean | string;
  getCacheConnection: () => ifxnjs; //| Database;
  queryBuilder: <T>() => IQueryBuilder<T>;
  reconnecting?: () => Promise<any>;
};
export type IAppInformixConfig = {
  dbServer: string;
  dbDatabase: string;
  dbHost: string;
  dbPort: string;
  dbUsername: string;
  dbPassword: string;
  dbLocale: string;
  dbClientLocale: string;
  queryLogs?: boolean | string;
};

export async function AppInformix(opt: { driver: string; config: IAppInformixConfig }) {
  const informix = opt.driver === "ibm_db" ? InformixIbmDb(opt.config) : InformixIfxnjs(opt.config);
  return await informix;
}

 async function InformixIbmDb(config: IAppInformixConfig): Promise<IAppInformix> {
   const ifx = new Pool();
   const consStr =
     config.dbClientLocale && config.dbLocale
       ? `DATABASE=${config.dbDatabase};HOST=${config.dbHost};DB_LOCALE=${config.dbLocale};Client_Locale=${config.dbClientLocale};PORT=${config.dbPort};UID=${config.dbUsername};PWD=${config.dbPassword};DELIMIDENT=Y;`
       : `DATABASE=${config.dbDatabase};HOST=${config.dbHost};PORT=${config.dbPort};UID=${config.dbUsername};PWD=${config.dbPassword};DELIMIDENT=Y;`;
   console.log(consStr);
   console.info("initializing informix with ibm_db driver...");
   return new Promise((resolve, reject) => {
     ifx.open(consStr, (err: Error, conn: Database) => {
       if (err) {
         return reject(err);
       }
       resolve(conn);
     });
   }).then((conn: Database) => {
     return {
       logs: config.queryLogs,
       getCacheConnection: () => conn,
       queryBuilder: <T>() => InformixQueryBuilder<T>(),
     };
   });
 }

async function InformixIfxnjs(config: IAppInformixConfig): Promise<IAppInformix> {
  //@ts-ignore
  const Informix = require("./informix/ifx") as typeof ifxnjs;
  const ifx = new Informix();
  const cache = {} as any;
  const consStr =
    config.dbClientLocale && config.dbLocale
      ? `SERVER=${config.dbServer};DATABASE=${config.dbDatabase};HOST=${config.dbHost};DB_LOCALE=${config.dbLocale};Client_Locale=${config.dbClientLocale};SERVICE=${config.dbPort};UID=${config.dbUsername};PWD=${config.dbPassword};DELIMIDENT=Y;`
      : `SERVER=${config.dbServer};DATABASE=${config.dbDatabase};HOST=${config.dbHost};SERVICE=${config.dbPort};UID=${config.dbUsername};PWD=${config.dbPassword};DELIMIDENT=Y;`;
  console.log(consStr);
  console.info("initializing informix with ifxnjs driver...");
  return new Promise((resolve, reject) => {
    ifx.open(consStr, (err: Error, conn: ifxnjs) => {
      if (err) {
        return reject(err);
      }
      cache.ifx = conn;
      resolve("ok");
    });
  }).then(() => {
    return {
      logs: config.queryLogs,
      getCacheConnection: () => cache.ifx,
      queryBuilder: <T>() => InformixQueryBuilder<T>(),
      reconnecting: async () => await reconnecting(),
    };
  });
  async function reconnecting(): Promise<any> {
    return new Promise((resolve, reject) => {
      ifx.open(consStr, (err: Error, conn: ifxnjs) => {
        if (err) {
          return reject(err);
        }
        delete cache.ifx;
        cache.ifx = conn;
        resolve("ok");
      });
    });
  }
}
