/** User class for message.ly */
const Message = require("./message");
const db = require("../db");
const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR, SECRET_KEY } = require("../config");
const ExpressError = require("../expressError");

/** User of the site. */

class User {
    /** register new user -- returns
     *    {username, password, first_name, last_name, phone}
     */

    static async register({
        username,
        password,
        first_name,
        last_name,
        phone,
    }) {
        // hash PW and then save to the DB
        let hashedPW = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
        //save to DB portion:
        let result = await db.query(
            `INSERT INTO users (username, password, first_name, last_name, phone) VALUES ($1,$2,$3,$4,$5) RETURNING username, password, first_name, last_name, phone`,
            [username, hashedPW, first_name, last_name, phone]
        );
        return result.rows[0];
    }

    /** Authenticate: is this username/password valid? Returns boolean. */

    static async authenticate(username, password) {
        if (!username || !password) {
            throw new ExpressError(
                "Both Username and Password are required fields",
                404
            );
        }
        const result = await db.query(
            `SELECT password FROM users WHERE username=$1`,
            username
        );
        const user = result.rows[0];
        if (user) {
            if (await bcrypt.compare(password, user.password)) {
                return user;
            }
        }
    }

    /** Update last_login_at for user */

    static async updateLoginTimestamp(username) {}

    /** All: basic info on all users:
     * [{username, first_name, last_name, phone}, ...] */

    static async all() {
        try {
            const result = await db.query(
                "SELECT username, first_name, last_name, phone FROM users"
            );
            return result.rows;
        } catch (e) {
            return next(e);
        }
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
        try {
            const result = await db.query(
                `SELECT username, first_name, last_name, phone FROM users WHERE username=$1`,
                [username]
            );
            if (!result.rows[0]) {
                throw new ExpressError("Invalid Username", 404);
            }
            return result.rows[0];
        } catch (e) {
            return next(e);
        }
    }

    /** Return messages from this user.
     *
     * [{id, to_user, body, sent_at, read_at}]
     *
     * where to_user is
     *   {username, first_name, last_name, phone}
     */

    static async messagesFrom(username) {}

    /** Return messages to this user.
     *
     * [{id, from_user, body, sent_at, read_at}]
     *
     * where from_user is
     *   {id, first_name, last_name, phone}
     */

    static async messagesTo(username) {}
}

module.exports = User;
