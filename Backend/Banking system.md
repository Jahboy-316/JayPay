Banking system 
users are registered using names, phone number and age
account number is created using phone number
you set pin using account number, input desired pin and confirm pin


Dummy User — Registration & Login

1. Register User

POST
/api/auth/register
{
    "firstName": "David",
    "surname": "Okafor",
    "phoneNumber": "08123456789",
    "age": 24
}

2. Set PIN

POST
/api/auth/set-pin
{
    "accountNumber": "8123456789",
    "pin": "4827",
    "confirmPin": "4827"
}

3. Login

POST
/api/auth/login
{
    "phoneNumber": "08123456789",
    "pin": "4827"
}

4. to view profile, paste generated jwt token from login

5. to deposit write amount in json format under body and paste jwt token to authorize account for deposit

6. /api/account/transfer 
    use this with json text containing account number of recipent and amount and pin
    {
        "accountNumber": "9098765432",
        "amount": "3200",
        "pin": "4827"
    }
    , with jwt token containing information of the sender to be able to send to someone

Dummy second user to send money to
create user account and make pin, no need to login

    {
    "firstName": "Michael",
    "surname": "Adeyemi",
    "phoneNumber": "09098765432",
    "age": 27
    }

create pin
    {
    "accountNumber": "9098765432",
    "pin": "5678",
    "confirmPin": "5678"
    }

7. To change pin go to /api/auth/change-pin user must be logged in and provided jwt for change of pin to work, it uses the info of the user from the jwt token to match the pin. Current pin, new pin and new pin confirmation are needed.

{
    "currentPin": "4827",
    "newPin": "1234",
    "confirmPin": "1234"
}

8. Admins accounts are given by the bank database itself with a prechosen pin, the pin for the only admin account available is 2468

{
    "username": "jason_admin",
    "pin": "2468"
}