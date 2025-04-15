DIR=protobufs
OUTDIR=src/protos

protoc -I=$DIR user.proto post.proto lupyd-md.proto ads.proto auth.proto credits.proto chats.proto  --plugin=node_modules/ts-proto/protoc-gen-ts_proto  --ts_proto_opt=forceLong=bigint  --ts_proto_opt=env=browser --ts_proto_out=$OUTDIR

echo "Done"
