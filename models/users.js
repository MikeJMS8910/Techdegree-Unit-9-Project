const { Model, DataTypes } = require('sequelize');

//sets up the users model
module.exports = (sequelize) => {
    class User extends Model {}
    User.init({
        firstName: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notNull: {
                    msg: 'You need a first name'
                },
                notEmpty: {
                    msg: 'Please make sure that you have a first name'
                }
            }
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notNull: {
                    msg: 'You need a last name'
                },
                notEmpty: {
                    msg: 'Please make sure that you have a last name'
                }
            }
        },
        emailAddress: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: {
                    msg: 'Please make sure that the email you added is a valid email format'
                },
                notNull: {
                    msg: 'You need an email address'
                },
                notEmpty: {
                    msg: 'Please make sure that you have an email address'
                }
            }
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notNull: {
                    msg: 'You naeed a password'
                },
                notEmpty: {
                    msg: 'Please make sure that you have a password'
                }

            }
        },
    }, { sequelize });

    User.associate = (models) => {
        User.hasMany(models.Course, { foreignKey: 'userId' });
    };

    return User;
};