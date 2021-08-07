const { Model, DataTypes } = require('sequelize');

//set up the course model
module.exports = (sequelize) => {
    class Course extends Model {}
    Course.init({
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notNull: {
                    msg: 'You need a title'
                },
                notEmpty: {
                    msg: 'Please make sure that you have a title'
                }
            }
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notNull: {
                    msg: 'You need a description'
                },
                notEmpty: {
                    msg: 'Please make sure that you have a description'
                }
            }
        },
        estimatedTime: {
            type: DataTypes.STRING
            
        },
        materialsNeeded: {
            type: DataTypes.STRING
        }
    }, { sequelize });

    Course.associate = (models) => {
        Course.belongsTo(models.User, { foreignKey: 'userId' });
    };

    return Course;
};