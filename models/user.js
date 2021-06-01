/** User class for message.ly */
const db = require("../db")
const bcrypt = require("bcrypt")
const ExpressError = require("../expressError");
const {BCRYPT_WORK_FACTOR} = require("../config")



/** User of the site. */

class User {

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({username, password, first_name, last_name, phone}) { 
        const currentDate = new Date();
        const hashPass = await bcrypt.hash(password,BCRYPT_WORK_FACTOR)
        const response = await db.query(
          `INSERT INTO users (username,password,first_name,last_name,phone,join_at,last_login_at)
          VALUES
          ($1,$2,$3,$4,$5,$6,$7) RETURNING username,password,first_name,last_name,phone`,
          [username,hashPass,first_name,last_name,phone,currentDate,currentDate]
        );
        return response.rows[0];
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) { 
        const response = await db.query(
          `SELECT username,password FROM users WHERE username=$1`,[username]
        );
        const currentUser = response.rows[0];
        if(!currentUser) throw new ExpressError("Username not found",404);
        
        const auth = await bcrypt.compare(password,currentUser.password)
        if(auth){
          return true;
        }else{
          return false;
        }
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) { 
      const currentDate = new Date();
      const response = await db.query(
        `UPDATE users SET last_login_at=$1 WHERE username=$2 RETURNING username`,[currentDate,username]
        );
      if(response.rows.length === 0) throw new ExpressError("Username not found");
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() { 
    const response = await db.query(
      `SELECT username,first_name,last_name,phone FROM users`
    );
    return response.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) { 
    const response = await db.query(
      `SELECT username,first_name,last_name,phone,join_at,last_login_at FROM users WHERE username=$1`,[username]
    );
    if(response.rows.length === 0) throw new ExpressError("User Not Found",404)
    return response.rows[0];
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) { 
    const response_msg = await db.query(
      `SELECT id,to_username,body,sent_at,read_at FROM messages WHERE from_username=$1`
      ,[username]
    );
    if(response_msg.rows.length === 0) throw new ExpressError("Message not found",404)
    const {id,to_username,body,sent_at,read_at} = response_msg.rows[0];
    const response_user = await db.query(
      `SELECT username,first_name,last_name,phone FROM users WHERE username=$1`
      ,[to_username]
    );
    if(response_user.rows.length === 0) throw new ExpressError("User not found",404)
    

    return [{id,body,sent_at,read_at,to_user:response_user.rows[0]}];
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const response_msg = await db.query(
      `SELECT id,from_username,body,sent_at,read_at FROM messages WHERE to_username=$1`
      ,[username]
    );
    if(response_msg.rows.length === 0) throw new ExpressError("Message not found",404)
    const {id,from_username,body,sent_at,read_at} = response_msg.rows[0];
    const response_user = await db.query(
      `SELECT username,first_name,last_name,phone FROM users WHERE username=$1`
      ,[from_username]
    );
    if(response_user.rows.length === 0) throw new ExpressError("User not found",404)
    return [{id,body,sent_at,read_at,from_user:response_user.rows[0]}];
  }
}


module.exports = User;