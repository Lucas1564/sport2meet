import mongoose from "mongoose"
import supertest from "supertest"
import app from "../app.js"
import {
    cleanUpDatabase,
    generateValidJwt
} from "./utils.js"
import User from "../models/user.js"

beforeEach(cleanUpDatabase);

//POST /users
describe('POST /users', function () {
    //Test to create a user
    it('should create a user', async function () {
        const res = await supertest(app)
            .post('/users')
            .send({
                email: 'admin@gmail.com',
                firstname: 'Admin',
                lastname: 'Admin',
                password: '12345678',
                role: 'admin'
            })
            .expect(200)
            .expect('Content-Type', /json/);
        // Check that the response body is a JSON object with exactly the properties we expect.
        expect(res.body).toEqual(
            expect.objectContaining({
                id: expect.any(String),
                email: 'admin@gmail.com',
                firstname: 'Admin',
                lastname: 'Admin',
                role: 'admin',
                registrationDate: expect.any(String)
            })
        );
        expect(res.body).toContainAllKeys(['id', 'email', 'firstname', 'lastname', 'role', 'registrationDate'])
    });

    //Test when there is a missing field for register as a user
    test('missing required field', async function () {
        const res = await supertest(app)
            .post('/users')
            .send({
                email: "admin@gmail.com",
                firstname: "Admin",
                password: '12345678',
                role: 'admin'
            })
            .expect(500)
            .expect('Content-Type', /html/);
        expect(res.text).toEqual('User validation failed: lastname: Path `lastname` is required.');
    });

    //Test when the password is too short
    test('wrong lenght of password', async function () {
        const res = await supertest(app)
            .post('/users')
            .send({
                email: "admin@gmail.com",
                firstname: "Admin",
                lastname: "Admin",
                password: '1234',
                role: 'admin'
            })
            .expect(500)
            .expect('Content-Type', /html/);
        expect(res.text).toEqual('Password is too short (8 characters minimum)');
    });
});

//GET /users
describe('GET /users', function () {
    let johnDoe;
    let janeDoe;
    beforeEach(async function () {
        // Create 2 users before retrieving the list.
        [johnDoe] = await Promise.all([
            User.create({
                email: 'john@gmail.com',
                firstname: 'John',
                lastname: 'Doe',
                password: '12345678'
            })
        ]);
        [janeDoe] = await Promise.all([
            User.create({
                email: 'jane@gmail.com',
                firstname: 'Jane',
                lastname: 'Doe',
                password: '12345678'
            })
        ]);
    });
    //Test that retrieve the list of users
    test('should retrieve the list of users', async function () {
        const token = await generateValidJwt(johnDoe);
        const res = await supertest(app)
            .get('/users')
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .expect('Content-Type', /json/);

        expect(res.body).toHaveLength(2);
        expect(res.body[0]).toContainAllKeys(['id', 'email', 'firstname', 'lastname', 'role', 'registrationDate'])

        expect(res.body[0]).toEqual(
            expect.objectContaining({
                id: expect.any(String),
                email: 'john@gmail.com',
                firstname: 'John',
                lastname: 'Doe',
                role: 'user',
                registrationDate: expect.any(String)
            })
        );
        expect(res.body[1]).toEqual(
            expect.objectContaining({
                id: expect.any(String),
                email: 'jane@gmail.com',
                firstname: 'Jane',
                lastname: 'Doe',
                role: 'user',
                registrationDate: expect.any(String)
            })
        );
    });
});

//Patch /users/id/:id
describe('PATCH /users/id/:id', function () {
    let johnDoe;
    let janeDoe;
    beforeEach(async function () {
        // Create 2 users before patching one user.
        [johnDoe] = await Promise.all([
            User.create({
                email: 'john@gmail.com',
                firstname: 'John',
                lastname: 'Doe',
                password: '12345678'
            })
        ]);
        [janeDoe] = await Promise.all([
            User.create({
                email: 'jane@gmail.com',
                firstname: 'Jane',
                lastname: 'Doe',
                password: '12345678'
            })
        ]);
    });
    test('should modify user john doe', async function () {
        const token = await generateValidJwt(johnDoe);
        const res = await supertest(app)
            .patch(`/users/id/${johnDoe._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                firstname: 'Johnny',
            })
            .expect(200)
            .expect('Content-Type', /html/);
        expect(res.text).toEqual("User modifié");
    });
});

//Delete /users/id/:id
describe('DELETE /users/id/:id', function () {
    let johnDoe;
    let janeDoe;
    beforeEach(async function () {
        // Create 2 users before patching one user.
        [johnDoe] = await Promise.all([
            User.create({
                email: 'john@gmail.com',
                firstname: 'John',
                lastname: 'Doe',
                password: '12345678'
            })
        ]);
        [janeDoe] = await Promise.all([
            User.create({
                email: 'jane@gmail.com',
                firstname: 'Jane',
                lastname: 'Doe',
                password: '12345678'
            })
        ]);
    });
    test('should delete user john doe', async function () {
        const token = await generateValidJwt(janeDoe);
        const res = await supertest(app)
            .delete(`/users/id/${janeDoe._id}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .expect('Content-Type', /html/);
        expect(res.text).toEqual("User supprimé");
    });
});


afterAll(async () => {
    await mongoose.disconnect();
});