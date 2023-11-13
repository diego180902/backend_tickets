import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, ScanCommand  } from "@aws-sdk/lib-dynamodb"
import { randomUUID } from "crypto"

const ddbTicketsClient = DynamoDBDocumentClient.from(new DynamoDBClient({region: "us-east-2"}))

export const handler = async (event) => {
  
    if(event.requestContext.http.path === "/loginClienteEmail" && event.requestContext.http.method === "POST"){ // Recuperamos la ruta que se invoca y el metodo
    
        try {
          
          const credenciales = JSON.parse(event.body);
          
          const params = {
            TableName: "ClienteV2",
            Key: {
              'contacto':credenciales.useremail,
            },
          };
          
          const data = await ddbTicketsClient.send(new GetCommand(params));
          
          if(data.Item){
            
            if(data.Item.password === credenciales.password){
              
              return data.Item
              
            }else{
              
              return {
                statusCode: 401,
                body: JSON.stringify({ message: "Credenciales inválidas" }),
              };
              
            }
            
          }else{
            
            return {
              statusCode: 401,
              body: JSON.stringify({ message: "Credenciales inválidas" }),
            };
            
          }
          
        }catch (error) {
          
          console.error(error);
          return{
            statusCode: 500,
            body: JSON.stringify({message: error.message})
          }
          
        }
      
    }else if(event.requestContext.http.path === "/createUser" && event.requestContext.http.method === "POST") { // Creamos un nuevo usuario
      
      try {
        const cliente = JSON.parse(event.body);
      
        /*
        const newClient = {
          ...cliente,
          id: randomUUID()
        }
        */
        
        await ddbTicketsClient.send(new PutCommand({ 
          TableName: "ClienteV2",
          Item: cliente
        }));
        
        return {
          statusCode: 201,
          body: JSON.stringify(cliente)
        }
      
      }catch (error) {
        console.error(error);
        return{
          statusCode: 500,
          body: JSON.stringify({message: error.message})
        }
      }
      
    }else if(event.requestContext.http.path === "/loginGetClientEmail" && event.requestContext.http.method === "GET") { // Login INSEGURO
      
      try{
        
        const credenciales = event.queryStringParameters;
        
        // Verifica si los parámetros existen y no son nulos
        if (credenciales && credenciales.contacto && credenciales.password) {
          // Elimina las llaves y las comillas de las cadenas
          const contacto = credenciales.contacto.replace(/[{}"]/g, '');
          const password = credenciales.password.replace(/[{}"]/g, '');
    
          const params = {
            TableName: "ClienteV2",
            Key: {
              'contacto':contacto,
            },
          };
          
          const data = await ddbTicketsClient.send(new GetCommand(params));
          
          if(data.Item){
            
            if(data.Item.password === password){
              
              return data.Item
              
            }else{
              
              return {
                statusCode: 401,
                body: JSON.stringify({ message: "Credenciales inválidas" }),
              };
              
            }
            
          }else{
            
            return {
              statusCode: 401,
              body: JSON.stringify({ message: "Credenciales inválidas" }),
            };
            
          }
          
        } else {
          
          // Manejar el caso en el que los parámetros no estén presentes
          return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Parámetros faltantes o incorrectos' }),
          };
          
        }
        
      }catch (error) {
          
        console.error(error);
        return{
          statusCode: 500,
          body: JSON.stringify({message: error.message})
        }
        
      }
      
    }else if(event.requestContext.http.path === "/registrarTicket" && event.requestContext.http.method === "POST") {
      
      try{
        
        const ticket = JSON.parse(event.body);
      
        const newTicket = {
          ...ticket,
          id: randomUUID()
        }
        
        await ddbTicketsClient.send(new PutCommand({ 
          TableName: "TicketV2",
          Item: newTicket
        }));
        
        return {
          statusCode: 201,
          body: JSON.stringify({message: "Ticket registrado exitosamente"})
        }
        
      }catch(error){
        
        console.error(error);
        return{
          statusCode: 500,
          body: JSON.stringify({message: error.message})
        }
        
      }
      
    }else if(event.requestContext.http.path === "/getTicketByClient" && event.requestContext.http.method === "GET") {
      
      try{
        
        const clienteID = event.queryStringParameters;
        
        // Verifica si los parámetros existen y no son nulos
        if (clienteID && clienteID.clienteID) {
          // Elimina las llaves y las comillas de las cadenas
          const idCliente = clienteID.clienteID.replace(/[{}"]/g, '');
          
          const params = {
            TableName: 'TicketV2',
            IndexName: 'clienteID-index', // Nombre de tu índice global
            KeyConditionExpression: 'clienteID = :id',
            ExpressionAttributeValues: {
              ':id': idCliente, // El valor del clienteID que estás buscando
            },
          };
          
          //const data = await ddbTicketsClient.send(new GetCommand(params));
          const data = await ddbTicketsClient.send(new QueryCommand(params)); // Cambié GetCommand a QueryCommand
          console.log("Consulta exitosa:", data);
          
          if(data.Items){
            
            return data.Items
            
          }else{
            
            return {
              statusCode: 401,
              body: JSON.stringify({ message: "No se encontro ningun ticket" }),
            };
            
          }
          
        } else {
          
          // Manejar el caso en el que los parámetros no estén presentes
          return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Parámetros faltantes o incorrectos' }),
          };
          
        }
         
      }catch (error) {
          
        console.error(error);
        return{
          statusCode: 500,
          body: JSON.stringify({message: error.message})
        }
        
      }
      
    }else if(event.requestContext.http.path === "/getAllTickets" && event.requestContext.http.method === "GET") {
      
      try{
        
        // Parámetros del escaneo
        const params = {
          TableName: "TicketV2",
        };
        
        // Realiza el escaneo para recuperar todos los elementos
        const data = await ddbTicketsClient.send(new ScanCommand(params));
        
        if(data.Items){
            
          return data.Items
          
        }else{
          
          return {
            statusCode: 401,
            body: JSON.stringify({ message: "No se encontro ningun ticket" }),
          };
          
        }
        
      }catch (error){
        
        console.error(error);
        return{
          statusCode: 500,
          body: JSON.stringify({message: error.message})
        }
        
      }
      
    }
    
};