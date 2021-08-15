import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsService } from './clients.service';
import { Client, ClientSchema } from './client.model';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: Client.name, schema: ClientSchema }
		])
	],
	providers: [ ClientsService ],
	exports: [ ClientsService ]
})
export class ClientsModule {}