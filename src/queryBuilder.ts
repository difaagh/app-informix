import * as dayjs from "dayjs";
import { DtoEntity } from "@interface/index";

export type IQueryBuilder<T> = {
  initCreate(T: Readonly<T>): string;
  initUpdate(T: Readonly<T>): string;
  initPagination(query: { page: number; size: number }): string;
  initFindSelect<Dto>(table: string, DTE: DtoEntity<Dto, T>, only?: Array<keyof T>): string;
  informixDate(date: Date): string;
  initCount(table: string, whereLike?: { where: string; value: string }): string;
  initJoinSelect<Dto>(table: string, DTE: DtoEntity<Dto, T>, only?: Array<keyof T>): string;
};
export const InformixQueryBuilder = <Entity>(): IQueryBuilder<Entity> => {
  return {
    initCreate(entity: Readonly<Entity>): string {
      let c = "";
      let v = "";
      for (const key in entity) {
        if (entity[key] && entity[key] !== undefined) {
          if (typeof entity[key] === "number") {
            c += `${key},`;
            v += `${entity[key]},`;
          } else {
            c += `${key},`;
            /*
             * check wheter value have quote mark
             * informix will throw error if we don't add extra quote on it
             */
            //@ts-ignore
            if (entity[key].includes(`'`)) {
              const x = addOneMoreQuoteMarkToEachQuoteMark(entity[key] as any);
              v += `'${x}',`;
            } else {
              // in here the value dont have quote mark, so we just concat to var v
              v += `'${entity[key]}',`;
            }
          }
        }
      }
      const column = c.slice(0, -1);
      const values = v.slice(0, -1);
      return `(${column}) VALUES (${values})`;
    },
    initUpdate(entity: Readonly<Entity>): string {
      let cv = "";
      for (const key in entity) {
        if (entity[key] && entity[key] !== undefined) {
          if (typeof entity[key] === "number") {
            cv += `${key} = ${entity[key]},`;
          } else {
            /*
             * check wheter value have quote mark
             * informix will throw error if we don't add extra quote on it
             */
            //@ts-ignore
            if (entity[key].includes(`'`)) {
              const x = addOneMoreQuoteMarkToEachQuoteMark(entity[key] as any);
              cv += `${key} = '${x}',`;
            } else {
              cv += `${key} = '${entity[key]}',`;
            }
          }
        }
      }
      const columnValues = cv.slice(0, -1);
      return columnValues;
    },
    initPagination(query: { page: number; size: number }): string {
      if (query.size < 0) {
        return "";
      }
      const skip = (query.page - 1) * query.size;
      const first = query.size;
      const p = `SKIP ${skip} FIRST ${first}`;
      return p;
    },
    initFindSelect<Dto>(table: string, DTE: DtoEntity<Dto, Entity>, only?: Array<keyof Entity>): string {
      const arrTemp = only ? [] : null;
      if (only) {
        for (let d = 0; d < only.length; d++) {
          DTE.some((b) => {
            if (b[1] === only[d]) {
              arrTemp.push(b);
              return true;
            }
          });
        }
      }
      let e = "";
      if (arrTemp) {
        for (let i = 0; i < arrTemp.length; i++) {
          e += `${table}.${arrTemp[i][1]} AS "${arrTemp[i][0]}",`;
        }
        const v = e.slice(0, -1);
        return v;
      } else {
        for (let i = 0; i < DTE.length; i++) {
          e += `${table}.${DTE[i][1]} AS "${DTE[i][0]}",`;
        }
        const v = e.slice(0, -1);
        return v;
      }
    },
    initJoinSelect<Dto>(table: string, DTE: DtoEntity<Dto, Entity>, only?: Array<keyof Entity>): string {
      const arrTemp = only ? [] : undefined;
      if (only) {
        for (let d = 0; d < only.length; d++) {
          DTE.some((b) => {
            if (b[1] === only[d]) {
              arrTemp.push(b);
              return true;
            }
          });
        }
      }
      let e = "";
      if (arrTemp) {
        for (let i = 0; i < arrTemp.length; i++) {
          e += `${table}.${arrTemp[i][1]} AS "${arrTemp[i][0]}",`;
        }
        const v = e.slice(0, -1);
        return v;
      } else {
        for (let i = 0; i < DTE.length; i++) {
          e += `${table}.${DTE[i][1]} AS "${DTE[i][0]}",`;
        }
        const v = e.slice(0, -1);
        return v;
      }
    },
    initCount(
      table: string,
      whereLike?: {
        where: string;
        value: string;
      }
    ): string {
      if (whereLike) {
        const like = whereLike.value === "null" ? `is null` : `like '%${whereLike.value}%'`;
        // change default from id to date_created because some field use different name
        // date_created is must in each table
        return `(SELECT COUNT(DISTINCT date_created) FROM ${table} WHERE ${whereLike.where} ${like}) as ${table}_total`;
      }
      return `(SELECT COUNT (DISTINCT date_created) FROM ${table}) as ${table}_total`;
    },
    informixDate(param: Date): string {
      function isValidDate(d: Date): boolean {
        // @ts-ignore
        return d instanceof Date && !isNaN(d);
      }
      const check = isValidDate(param);
      if (!check) {
        throw Error("invalid date = " + param);
      }
      return dayjs(param).format("YYYY-MM-DD HH:mm:ss");
    },
  };
};

function addOneMoreQuoteMarkToEachQuoteMark(stringWithQuoteMark: string): string {
  //@ts-ignore
  const arr = stringWithQuoteMark.split(`'`);
  /*
   *  here logic to add extra quote for value that have quote
   *  example :
   *    before -> harry's and potter's
   *    after -> harry''s and potter''s
   */
  let x = "";
  for (let i = 0; i < arr.length; i++) {
    if (i === arr.length - 1) {
      x += `${arr[i]}`;
    } else {
      x += `${arr[i]}''`;
    }
  }
  return x;
}
